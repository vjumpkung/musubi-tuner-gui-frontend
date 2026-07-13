# Backend API contract

The GUI backend is a single FastAPI service that covers three areas:

- **Downloads** — run allowlisted model download scripts as async jobs.
- **Dataset manager** — store multiple musubi-tuner dataset configurations and import/export them
  as `.toml` files (see the
  [musubi-tuner dataset config spec](https://github.com/kohya-ss/musubi-tuner/blob/main/docs/dataset_config.md)).
- **Training job queue** — create training jobs that execute one at a time through a FIFO queue.

The frontend reads the base URL from `VITE_API_BASE_URL`; when it is unset, requests are sent to
the frontend origin.

## Persistence (async SQLite)

Dataset configs and training jobs are persisted in a single SQLite database accessed
asynchronously — SQLAlchemy 2.0 async engine over the `aiosqlite` driver
(`sqlite+aiosqlite:///{DATA_ROOT}/musubi_gui.db`). Plain `aiosqlite` is an acceptable
zero-dependency alternative; the contract below does not depend on the ORM choice.

Connection setup:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
```

### Schema

```sql
CREATE TABLE dataset_configs (
    id            TEXT PRIMARY KEY,           -- uuid4
    name          TEXT NOT NULL UNIQUE,
    description   TEXT,
    config_json   TEXT NOT NULL,              -- canonical JSON form of the TOML document
    created_at    TEXT NOT NULL,              -- ISO-8601 UTC
    updated_at    TEXT NOT NULL
);

CREATE TABLE training_jobs (
    id                    TEXT PRIMARY KEY,   -- uuid4
    name                  TEXT NOT NULL,
    profile_id            TEXT NOT NULL,      -- allowlisted training profile id
    dataset_config_id     TEXT REFERENCES dataset_configs(id) ON DELETE SET NULL,
    dataset_config_toml   TEXT NOT NULL,      -- snapshot rendered at enqueue time
    values_json           TEXT NOT NULL,      -- typed field values used to build argv
    status                TEXT NOT NULL DEFAULT 'queued',
                                              -- queued | running | completed | failed | cancelled
    queue_position        INTEGER,            -- only meaningful while status = 'queued'
    current_stage         TEXT,               -- cache_latents | cache_text_encoder | train
    stages_json           TEXT NOT NULL,      -- per-stage status list
    progress_json         TEXT,               -- {"epoch", "step", "total_steps", "percent"}
    error                 TEXT,
    log_path              TEXT,               -- combined stdout/stderr file on disk
    created_at            TEXT NOT NULL,
    started_at            TEXT,
    finished_at           TEXT
);

CREATE INDEX idx_training_jobs_status ON training_jobs (status, created_at);

CREATE TABLE app_settings (
    key           TEXT PRIMARY KEY,           -- e.g. 'training_queue_state'
    value         TEXT NOT NULL
);
```

Rules:

- Job logs are stored on disk under `{DATA_ROOT}/jobs/{job_id}.log`, not in the database. The
  database stores only the path.
- A training job snapshots the dataset config TOML at creation time, so editing or deleting a
  dataset config never changes an already-queued job.
- Download jobs keep working from the in-memory store described below; persisting them in a
  `download_jobs` table with the same columns is an optional extension for history across
  restarts.
- The queue runner is an asyncio task started in the FastAPI lifespan. **Run uvicorn with a
  single worker process** — multiple workers would start multiple queue runners against the same
  database and double-execute jobs.
- Startup recovery: any job still marked `running` was interrupted by a server restart; mark it
  `failed` with `error = "Interrupted by server restart"`. Jobs marked `queued` remain queued and
  run in their original order.
- The training queue's start/pause state is persisted in `app_settings` under
  `training_queue_state` and restored on restart. On first boot it is `paused`, so nothing runs
  until the user starts the queue.

## Downloads

The Downloads screen uses an asynchronous job API.

### Script allowlist

The API must map `script_id` to a fixed filename. Do not accept a filename or shell command from
the request.

| `script_id`            | Script filename                         |
| ---------------------- | --------------------------------------- |
| `flux2-dev`            | `download_flux2_dev.sh`                 |
| `flux-kontext-dev`     | `download_flux_kontext_dev.sh`          |
| `framepack`            | `download_framepack.sh`                 |
| `hidream-o1`           | `download_hidream_o1.sh`                |
| `hunyuan-video`        | `download_hunyuan_video.sh`             |
| `hunyuan-video-1-5`    | `download_hunyuan_video_1_5.sh`         |
| `ideogram-4`           | `download_ideogram4.sh`                 |
| `kandinsky-5-t2v`      | `download_kandinsky5_t2v.sh`            |
| `krea-2`               | `download_krea2.sh`                     |
| `qwen-image-bf16`      | `download_qwen_image_fp16.sh`           |
| `qwen-image-fp8`       | `download_qwen_image_fp8.sh`            |
| `qwen-image-edit`      | `download_qwen_image_edit_fp16.sh`      |
| `qwen-image-edit-2509` | `download_qwen_image_edit_2509_fp16.sh` |
| `wan-2-1-t2v-14b`      | `download_wan21_t2v_14B_fp16.sh`        |
| `wan-2-1-i2v-14b`      | `download_wan21_i2v_14B_fp16.sh`        |
| `wan-2-2-t2v-14b`      | `download_wan22_t2v_14B_fp16.sh`        |
| `wan-2-2-i2v-14b`      | `download_wan22_i2v_14B_fp16.sh`        |
| `z-image-base`         | `download_z_image_base_bf16.sh`         |
| `z-image-turbo`        | `download_z_image_turbo_bf16.sh`        |

### Start a download

`POST /api/downloads`

Request:

```json
{
    "script_id": "flux2-dev",
    "destination": "/workspace"
}
```

Return HTTP `202` with a job:

```json
{
    "id": "0e896a40-ff4c-447b-97a5-664d5eb58a94",
    "script_id": "flux2-dev",
    "status": "queued",
    "progress": 0,
    "message": "Waiting to start"
}
```

The allowed status values are `queued`, `running`, `completed`, `failed`, and `cancelled`.
`progress` is optional and, when present, must be a number from 0 through 100. `current_file`,
`message`, and `error` are optional strings.

Run the mapped script with `destination` as its working directory so its relative
`diffusion_models`, `vae`, `text_encoders`, and `image_encoder` paths resolve beneath that root:

```python
process = await asyncio.create_subprocess_exec(
    "bash",
    str(allowlisted_script_path),
    cwd=validated_destination,
    stdout=asyncio.subprocess.PIPE,
    stderr=asyncio.subprocess.STDOUT,
    start_new_session=True,
)
```

### Read job status

`GET /api/downloads/{job_id}`

Return HTTP `200` with the current job:

```json
{
    "id": "0e896a40-ff4c-447b-97a5-664d5eb58a94",
    "script_id": "flux2-dev",
    "status": "running",
    "progress": 35,
    "current_file": "diffusion_models/flux2_dev_fp8mixed.safetensors",
    "message": "Downloading FLUX.2 dev DiT"
}
```

The frontend polls this route every 1.5 seconds while the status is `queued` or `running`.

### Cancel a job

`POST /api/downloads/{job_id}/cancel`

Terminate the job's process group, set its status to `cancelled`, and return HTTP `200` with the
updated job object. Cancellation should be idempotent for an already-cancelled job. Return HTTP
`409` when a completed or failed job can no longer be cancelled.

## Dataset manager

A dataset config is a named, stored representation of one musubi-tuner `dataset_config.toml`
document. The user can keep many of them and pick one per training job.

### Data model

The stored `config_json` is the TOML document mapped one-to-one to JSON: the `[general]` table
becomes the `general` object and each `[[datasets]]` entry becomes an element of the `datasets`
array, with identical key names. No extra discriminator keys are added — a dataset's type is
inferred from which source key it carries (`image_directory`, `image_jsonl_file`,
`video_directory`, or `video_jsonl_file`), exactly as the trainer does. This keeps
import → edit → export a clean round trip.

Resource shape:

```json
{
    "id": "7be1f3a2-4c0e-4a57-9d3e-1f2a33f0c9d1",
    "name": "my-character-video",
    "description": "WAN 2.2 character dataset",
    "general": {
        "resolution": [960, 544],
        "caption_extension": ".txt",
        "batch_size": 1,
        "enable_bucket": true,
        "bucket_no_upscale": false
    },
    "datasets": [
        {
            "image_directory": "/workspace/data/char_images",
            "cache_directory": "/workspace/cache/char_images",
            "num_repeats": 2
        },
        {
            "video_directory": "/workspace/data/char_videos",
            "cache_directory": "/workspace/cache/char_videos",
            "target_frames": [1, 25, 45],
            "frame_extraction": "head",
            "source_fps": 30.0
        }
    ],
    "created_at": "2026-07-12T09:30:00Z",
    "updated_at": "2026-07-12T09:30:00Z"
}
```

Architecture-specific keys from the spec (`fp_latent_window_size`, `fp_1f_clean_indices`,
`fp_1f_target_index`, `fp_1f_no_post`, `multiple_target`, `control_directory`, `control_path`,
`no_resize_control`, `control_resolution`, ...) are passed through untouched. Unknown keys are
preserved rather than rejected — musubi-tuner adds options frequently — but are reported back in
a `warnings` array so typos are visible.

### Endpoints

| Method   | Route                         | Purpose                                   |
| -------- | ----------------------------- | ----------------------------------------- |
| `GET`    | `/api/datasets`               | List all configs (id, name, timestamps)   |
| `POST`   | `/api/datasets`               | Create a config from JSON                 |
| `POST`   | `/api/datasets/managed/batch` | Upload one or more managed dataset entries |
| `GET`    | `/api/datasets/{id}`          | Read one config                           |
| `PUT`    | `/api/datasets/{id}`          | Replace `name`/`description`/config body  |
| `DELETE` | `/api/datasets/{id}`          | Delete a config                           |
| `POST`   | `/api/datasets/import`        | Import a `.toml` file, returns new config |
| `GET`    | `/api/datasets/{id}/export`   | Download the config as a `.toml` file     |
| `POST`   | `/api/datasets/{id}/validate` | Check referenced paths on the server      |

`POST` and `PUT` accept `{ "name", "description", "general", "datasets" }` and return the full
resource — `201` on create, `200` on update. Return `409` when `name` is already taken.
`DELETE` returns `204`; it is always allowed because jobs hold their own TOML snapshot (the
job's `dataset_config_id` becomes `null` via `ON DELETE SET NULL`).

`POST /api/datasets/managed/batch` accepts multipart data. `dataset_specs` is a JSON array whose
entries contain `media_type`, `resolution`, `num_repeats`, optional `target_frames`, `captions`, and
the `file_count`, `caption_file_count`, and `control_file_count` used to partition the repeated
upload fields. Each entry is stored in its own media/cache/control directories and rendered as one
`[[datasets]]` table in the resulting TOML. The endpoint also accepts `name`, optional
`description`, repeated `files`, and optional repeated `caption_files` and `control_files` fields.

### Import a TOML file

`POST /api/datasets/import`

`multipart/form-data` with a `file` field (the `.toml`) and an optional `name` field (defaults to
the filename without extension, deduplicated with a numeric suffix). Parse with `tomllib`,
validate as below, and return HTTP `201` with the created resource plus warnings:

```json
{
    "id": "7be1f3a2-4c0e-4a57-9d3e-1f2a33f0c9d1",
    "name": "my-character-video",
    "general": { "resolution": [960, 544] },
    "datasets": [{ "video_directory": "/workspace/data/char_videos" }],
    "warnings": ["datasets[0]: unknown key 'frame_extractoin' was preserved"]
}
```

Return `400` with the parse error message for invalid TOML, `422` for TOML that parses but
violates the validation rules.

### Export a TOML file

`GET /api/datasets/{id}/export`

Return HTTP `200` with `Content-Type: application/toml` and
`Content-Disposition: attachment; filename="{slugified-name}.toml"`. The body is rendered from
`config_json` with `tomli-w`. Comments from an originally imported file are not preserved —
`tomllib` drops them at parse time; document this in the UI.

### Validation rules

Applied on create, update, and import (`422` on violation unless marked as a warning):

- `datasets` must be a non-empty array.
- Each dataset must have exactly one source key: `image_directory`, `image_jsonl_file`,
  `video_directory`, or `video_jsonl_file`.
- `resolution` must be present in `general` or in every dataset.
- Directory-based datasets need `caption_extension` in `general` or the dataset.
- JSONL-based datasets require `cache_directory`.
- `cache_directory` values must be unique across the datasets in one config (the spec requires a
  distinct cache directory per dataset). Missing `cache_directory` on a directory-based dataset
  is a warning, not an error.
- Video datasets: `frame_extraction` must be one of `head`, `chunk`, `slide`, `uniform`, `full`.
  `target_frames` is required unless `frame_extraction` is `full`; `max_frames` applies to
  `full`; `frame_stride` applies to `slide`; `frame_sample` applies to `uniform`. Warn when
  `frame_extraction` is `chunk` and `target_frames` contains `1`, and when a `target_frames`
  value is not `N*4+1`.
- `source_fps`, when present, must be a number (rendered as a float in TOML, e.g. `30.0`).
- `num_repeats`, when present in `[general]` or a dataset, must be a positive integer.
- Unknown keys produce warnings and are preserved.

`POST /api/datasets/{id}/validate` additionally checks the filesystem and returns per-dataset
results: whether each `image_directory`/`video_directory`/JSONL file exists, how many
image/video/caption files were found, and whether `cache_directory` is creatable. It never
creates or deletes anything.

## Training job queue

Creating a training job only **enqueues** it — nothing runs until the user starts the queue.
The queue itself has two states, `paused` and `running`, controlled by explicit start/pause
endpoints (a Start button in the UI). While the queue is `running`, jobs execute strictly one at
a time (the GPU is the shared resource) in FIFO order. A job is a sequence of stages executed in
order:

1. `cache_latents` — the profile's latent-cache script
2. `cache_text_encoder` — the profile's text-encoder-cache script
3. `train` — the trainer via `accelerate launch`

A stage failure marks the job `failed` and the remaining stages `skipped`. `skip_cache_stages`
lets the user rerun training against existing caches.

### Building the command

The request carries `profile_id` plus typed `values` — the same field keys the frontend forms use
(`src/components/training/profiles.ts`). The backend owns a mirror of those profile definitions
and builds each stage's argv from them. As with downloads, the client never sends a command
string or script path:

- `profile_id` must be one of the allowlisted profile ids: `hunyuan-video`,
  `hunyuan-video-1-5`, `framepack`, `framepack-one-frame`, `wan-22`, `wan-one-frame`,
  `flux-kontext`, `flux-2`, `qwen-image`, `z-image-turbo`, `hidream-o1`, `ideogram-4`,
  `kandinsky-5`, `krea-2`. Unknown ids return `404`.
- The dataset config snapshot is written to `{DATA_ROOT}/jobs/{job_id}/dataset_config.toml` and
  its path is passed as `--dataset_config`; the client cannot point the trainer at an arbitrary
  file.
- `values.extraArgs` is split with `shlex.split` and appended as individual argv items. Each
  token must match `^[A-Za-z0-9_.\/=:,+()\-]+$`; anything else returns `400`. There is no shell
  involved (`create_subprocess_exec` only), so this guards against confusing flags rather than
  injection.
- Never echo `values.huggingfaceToken` back in job objects or logs; store it only in
  `values_json` and redact it in `GET` responses.

### Job object

```json
{
    "id": "c1a2b3d4-5678-49ab-9cde-0f1234567890",
    "name": "wan22 character lora v3",
    "profile_id": "wan-22",
    "dataset_config_id": "7be1f3a2-4c0e-4a57-9d3e-1f2a33f0c9d1",
    "status": "queued",
    "queue_position": 2,
    "current_stage": null,
    "stages": [
        { "key": "cache_latents", "status": "pending" },
        { "key": "cache_text_encoder", "status": "pending" },
        { "key": "train", "status": "pending" }
    ],
    "progress": { "epoch": null, "step": null, "total_steps": null, "percent": null },
    "error": null,
    "created_at": "2026-07-12T10:00:00Z",
    "started_at": null,
    "finished_at": null
}
```

Job `status` values are `queued`, `running`, `completed`, `failed`, and `cancelled`. Stage
`status` values are `pending`, `running`, `completed`, `failed`, `skipped`, and `cancelled`.
`queue_position` is 0-based among queued jobs and `null` otherwise. `progress` is best-effort,
parsed from trainer output (tqdm step lines); all of its fields may stay `null`.

### Endpoints

| Method   | Route                            | Purpose                                    |
| -------- | -------------------------------- | ------------------------------------------ |
| `GET`    | `/api/training/queue`            | Read queue state and counts                |
| `POST`   | `/api/training/queue/start`      | Start draining the queue                   |
| `POST`   | `/api/training/queue/pause`      | Stop picking up further jobs               |
| `POST`   | `/api/training/jobs`             | Create and enqueue a job (`202`)           |
| `GET`    | `/api/training/jobs`             | List jobs, `?status=` filter, newest first |
| `GET`    | `/api/training/jobs/{id}`        | Read one job                               |
| `GET`    | `/api/training/jobs/{id}/logs`   | Incremental log read                       |
| `POST`   | `/api/training/jobs/{id}/cancel` | Cancel a queued or running job             |
| `POST`   | `/api/training/jobs/{id}/retry`  | Clone a terminal job as a new queued job   |
| `PATCH`  | `/api/training/jobs/{id}`        | Reorder: `{ "queue_position": 0 }`         |
| `DELETE` | `/api/training/jobs/{id}`        | Delete a terminal job and its log file     |

### Queue control (start / pause)

`GET /api/training/queue` returns the queue state and summary counts:

```json
{
    "state": "paused",
    "queued": 3,
    "running_job_id": null
}
```

`POST /api/training/queue/start` sets the state to `running` and wakes the runner; it starts
executing the job at the front of the queue. `POST /api/training/queue/pause` sets the state to
`paused`: the runner stops picking up further jobs, but **the currently running job keeps
running** — use the job's cancel endpoint to stop it. Both return HTTP `200` with the queue
object and are idempotent (starting a running queue or pausing a paused one is a no-op).

The state is persisted (`app_settings.training_queue_state`) and restored on restart; the
default on first boot is `paused`. So the user flow is: create jobs → they pile up as `queued` →
click Start → the queue drains in order and keeps draining as new jobs are added, until paused.

### Create a training job

`POST /api/training/jobs`

```json
{
    "name": "wan22 character lora v3",
    "profile_id": "wan-22",
    "dataset_config_id": "7be1f3a2-4c0e-4a57-9d3e-1f2a33f0c9d1",
    "skip_cache_stages": false,
    "values": {
        "dit": "./diffusion_models/wan2.2_t2v_low_noise_14B_fp16.safetensors",
        "ditHigh": "./diffusion_models/wan2.2_t2v_high_noise_14B_fp16.safetensors",
        "vae": "./vae/wan_2.1_vae.safetensors",
        "t5": "./text_encoders/models_t5_umt5-xxl-enc-bf16.pth",
        "outputName": "char_v3",
        "outputDir": "./lora_training/outputs",
        "epochs": "1000",
        "learningRate": "1e-4",
        "fp8Base": false,
        "extraArgs": "--preserve_distribution_shape --log_with tensorboard"
    }
}
```

Validate the profile id, the referenced dataset config, and the required fields for that profile;
render and store the dataset TOML snapshot; insert the row with status `queued`; return HTTP
`202` with the job object. Creation never blocks on the queue — a job can be created while
another is running.

### Read status and logs

`GET /api/training/jobs/{id}` returns the job object. The frontend polls it every 1.5 seconds
while the status is `queued` or `running`, the same cadence as downloads.

`GET /api/training/jobs/{id}/logs?offset=0` returns a chunk of the combined stdout/stderr log
starting at byte `offset`:

```json
{
    "offset": 0,
    "next_offset": 18234,
    "content": "INFO:musubi_tuner ...",
    "eof": false
}
```

The frontend keeps `next_offset` and polls for appended output; `eof` is `true` once the job is
terminal and the full log has been returned. Cap each response (for example 64 KiB) so a long
training run never produces an unbounded payload.

### Cancel, retry, reorder, delete

- **Cancel** — a `queued` job is marked `cancelled` immediately and leaves the queue. A `running`
  job gets its process group terminated (SIGTERM, then SIGKILL after a grace period), its current
  stage marked `cancelled`, and the job marked `cancelled`. Idempotent for an already-cancelled
  job; `409` for `completed`/`failed`.
- **Retry** — allowed for `failed` and `cancelled` jobs. Creates a **new** job (`202`) from the
  stored `values_json` and the stored TOML snapshot, appended at the back of the queue. The
  original job is untouched.
- **Reorder** — `PATCH` with `queue_position` moves a `queued` job within the queue; other queued
  jobs shift accordingly. `409` when the job is not queued.
- **Delete** — allowed only for terminal jobs (`completed`, `failed`, `cancelled`); removes the
  row, the log file, and the snapshot directory. `409` for `queued`/`running` (cancel first).

### Runner behavior

A single asyncio worker task owns the queue:

1. Wait until the queue state is `running` (an `asyncio.Event` set/cleared by the start/pause
   endpoints), then pick the oldest `queued` job (lowest `queue_position`), mark it `running`,
   set `started_at`.
2. For each stage, spawn the stage's argv with
   `asyncio.create_subprocess_exec(..., start_new_session=True)`, `cwd` set to the workspace root
   (the validated `musubiPath`), and stream combined stdout/stderr line-by-line to the job's log
   file.
3. Parse progress from trainer output where recognizable (`steps: ... current/total`); update
   `progress_json` at most once per second to limit write churn.
4. On exit code 0 advance to the next stage; otherwise mark the stage and job `failed` with the
   last log lines as `error`.
5. After the last stage, mark the job `completed`, set `finished_at`, and loop.

Concurrency is 1 by default; a `MAX_CONCURRENT_TRAINING_JOBS` setting may raise it for multi-GPU
hosts, but the default contract is strictly serial.

## Errors and validation

Return FastAPI's standard error shape so the frontend can display it:

```json
{
    "detail": "Unknown download script"
}
```

- Return `400` for an invalid or disallowed destination, malformed TOML, or a rejected
  `extraArgs` token.
- Return `404` for an unknown `script_id`, `profile_id`, dataset config ID, or job ID.
- Return `409` when the same script already has an active job for the destination, a dataset
  config name is taken, or a job is in the wrong state for cancel/reorder/delete.
- Return `422` for a dataset config that parses but violates the validation rules.
- Return `503` when `bash`, the Hugging Face `hf` CLI, `accelerate`, or required server
  configuration is absent.
- Resolve destinations and output/logging directories and require them to be inside a configured
  root. Do not allow the client to select arbitrary server filesystem locations. Dataset source
  directories are only read, never created or deleted, and are checked via the validate
  endpoint.
- Execute with `create_subprocess_exec`; do not use `shell=True` and do not interpolate request
  values into a command string.
- Preserve combined stdout/stderr in a bounded job log for diagnostics. Never return Hugging Face
  tokens or environment secrets.
- If the API is hosted on a different origin, allow the Vite frontend origin with FastAPI CORS
  middleware and set `VITE_API_BASE_URL` to the API origin at frontend build time.

Progress is optional because the current shell scripts do not emit byte totals in a stable format.
The API can omit it and update only `message` or `current_file` from each script's `echo` lines; the
frontend still shows the correct running state.
