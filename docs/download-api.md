# Download API contract

The Downloads screen uses an asynchronous job API. The frontend reads the base URL from
`VITE_API_BASE_URL`; when it is unset, requests are sent to the frontend origin.

## Script allowlist

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

## Start a download

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

## Read job status

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

## Cancel a job

`POST /api/downloads/{job_id}/cancel`

Terminate the job's process group, set its status to `cancelled`, and return HTTP `200` with the
updated job object. Cancellation should be idempotent for an already-cancelled job. Return HTTP
`409` when a completed or failed job can no longer be cancelled.

## Errors and validation

Return FastAPI's standard error shape so the frontend can display it:

```json
{
    "detail": "Unknown download script"
}
```

- Return `400` for an invalid or disallowed destination.
- Return `404` for an unknown `script_id` or job ID.
- Return `409` when the same script already has an active job for the destination.
- Return `503` when `bash`, the Hugging Face `hf` CLI, or required server configuration is absent.
- Resolve the destination and require it to be inside a configured download root. Do not allow
  the client to select arbitrary server filesystem locations.
- Execute with `create_subprocess_exec`; do not use `shell=True` and do not interpolate request
  values into a command string.
- Preserve combined stdout/stderr in a bounded job log for diagnostics. Never return Hugging Face
  tokens or environment secrets.
- If the API is hosted on a different origin, allow the Vite frontend origin with FastAPI CORS
  middleware and set `VITE_API_BASE_URL` to the API origin at frontend build time.

Progress is optional because the current shell scripts do not emit byte totals in a stable format.
The API can omit it and update only `message` or `current_file` from each script's `echo` lines; the
frontend still shows the correct running state.
