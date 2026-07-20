export type TrainingValue = string | boolean

export type TrainingValues = Record<string, TrainingValue>

export type TrainingField = {
    key: string
    label: string
    helper: string
    required?: boolean
    trainFlag?: string
    when?: {
        key: string
        value: TrainingValue
    }
}

export type TrainingOption = {
    label: string
    value: string
}

export type TrainingSelect = {
    key: string
    label: string
    helper: string
    options: TrainingOption[]
    trainFlag?: string
}

export type TrainingCommandOption = {
    flag: string
    key?: string
    value?: string
    enabledKey?: string
    when?: {
        key: string
        value: TrainingValue
    }
}

export type TrainingCacheCommand = {
    script: string
    options: TrainingCommandOption[]
}

export type TrainingProfile = {
    id:
        | 'hunyuan-video'
        | 'hunyuan-video-1-5'
        | 'framepack'
        | 'framepack-one-frame'
        | 'wan-22'
        | 'wan-one-frame'
        | 'flux-kontext'
        | 'flux-2'
        | 'qwen-image'
        | 'z-image-turbo'
        | 'hidream-o1'
        | 'ideogram-4'
        | 'kandinsky-5'
        | 'krea-2'
    name: string
    description: string
    script: string
    trainer: string
    networkModule: string
    modelFields: TrainingField[]
    selectors?: TrainingSelect[]
    advancedFields?: TrainingField[]
    cacheCommands?: TrainingCacheCommand[]
    fixedTrainFlags?: string[]
    cpuThreads?: number
    task?: {
        label: string
        helper: string
        options: TrainingOption[]
    }
    attentionOptions: TrainingOption[]
    memoryFlags: Array<{
        key: string
        label: string
        helper: string
        flag: string
        train?: boolean
    }>
    defaults: TrainingValues
}

const attention = {
    sdpa: { label: 'SDPA', value: 'sdpa' },
    xformers: { label: 'xFormers', value: 'xformers' },
    flash: { label: 'Flash Attention', value: 'flash_attn' },
    sage: { label: 'Sage Attention', value: 'sage_attn' }
}

const commonDefaults: TrainingValues = {
    musubiPath: './musubi-tuner',
    datasetConfig: 'dataset_config.toml',
    outputName: 'your_lora_name',
    outputDir: './lora_training/outputs',
    loggingDir: '',
    networkArgs: '',
    optimizerArgs: '',
    schedulerPower: '',
    schedulerMinRatio: '',
    schedulerCycles: '',
    seed: '42',
    gradientCheckpointing: true,
    persistentWorkers: true,
    huggingfaceRepoId: '',
    huggingfaceRepoType: 'model',
    huggingfacePath: '',
    huggingfaceToken: '',
    huggingfaceVisibility: 'private',
    asyncUpload: false,
    savePrecision: 'bf16',
    extraArgs: ''
}

export const trainingProfiles: Record<TrainingProfile['id'], TrainingProfile> = {
    'hunyuan-video': {
        id: 'hunyuan-video',
        name: 'Hunyuan Video',
        description:
            'Train a HunyuanVideo LoRA after caching video latents and both text encoders.',
        script: 'hunyuan_video_training_script.sh',
        trainer: 'hv_train_network.py',
        networkModule: 'networks.lora',
        modelFields: [
            {
                key: 'dit',
                label: 'DiT checkpoint',
                helper: 'HunyuanVideo transformer checkpoint.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'VAE checkpoint',
                helper: 'Used when caching training latents.',
                required: true
            },
            {
                key: 'textEncoder1',
                label: 'LLaVA-LLaMA3 encoder',
                helper: 'Primary text encoder used by the cache step.',
                required: true
            },
            {
                key: 'textEncoder2',
                label: 'CLIP-L encoder',
                helper: 'Secondary text encoder used by the cache step.',
                required: true
            }
        ],
        attentionOptions: [attention.sdpa, attention.flash, attention.xformers],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Enabled by the reference script to reduce DiT memory.',
                flag: '--fp8_base'
            },
            {
                key: 'fp8Llm',
                label: 'FP8 LLaMA cache',
                helper: 'Use FP8 for LLaMA during text-encoder caching.',
                flag: '--fp8_llm',
                train: false
            },
            {
                key: 'vaeTiling',
                label: 'VAE tiling',
                helper: 'Reduce memory during latent caching.',
                flag: '--vae_tiling',
                train: false
            }
        ],
        defaults: {
            ...commonDefaults,
            dit: './diffusion_models/mp_rank_00_model_states.pt',
            vae: './vae/pytorch_model.pt',
            textEncoder1: './text_encoders/llava_llama3_fp16.safetensors',
            textEncoder2: './text_encoders/clip_l.safetensors',
            epochs: '16',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '16',
            optimizer: 'adamw8bit',
            learningRate: '2e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            fp8Base: true,
            fp8Llm: false,
            vaeTiling: true,
            blocksToSwap: '0',
            vaeChunkSize: '32',
            timestepSampling: 'shift',
            flowShift: '7.0',
            weightingScheme: 'none',
            workers: '2',
            attention: 'sdpa',
            cacheBatchSize: '16'
        }
    },
    framepack: {
        id: 'framepack',
        name: 'FramePack',
        description: 'Train a FramePack I2V LoRA with the sharded DiT and vision encoder bundle.',
        script: 'framepack_training_script.sh',
        trainer: 'fpack_train_network.py',
        networkModule: 'networks.lora_framepack',
        modelFields: [
            {
                key: 'dit',
                label: 'DiT first shard',
                helper: 'Select shard 00001; the remaining shards must be beside it.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'HunyuanVideo VAE',
                helper: 'Used for latent caching and training.',
                required: true,
                trainFlag: '--vae'
            },
            {
                key: 'textEncoder1',
                label: 'LLaVA-LLaMA3 encoder',
                helper: 'Primary text encoder.',
                required: true,
                trainFlag: '--text_encoder1'
            },
            {
                key: 'textEncoder2',
                label: 'CLIP-L encoder',
                helper: 'Secondary text encoder.',
                required: true,
                trainFlag: '--text_encoder2'
            },
            {
                key: 'imageEncoder',
                label: 'SigLIP image encoder',
                helper: 'Required for FramePack image conditioning.',
                required: true,
                trainFlag: '--image_encoder'
            }
        ],
        attentionOptions: [attention.sdpa, attention.xformers],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Enable together with FP8 scaled for low VRAM.',
                flag: '--fp8_base'
            },
            {
                key: 'fp8Scaled',
                label: 'FP8 scaled',
                helper: 'Enable together with FP8 base.',
                flag: '--fp8_scaled'
            },
            {
                key: 'fp8Llm',
                label: 'FP8 LLaMA cache',
                helper: 'Reduce memory during text-encoder caching.',
                flag: '--fp8_llm',
                train: false
            }
        ],
        defaults: {
            ...commonDefaults,
            dit: './diffusion_models/diffusion_pytorch_model-00001-of-00003.safetensors',
            vae: './vae/hunyuan_video_vae_bf16.safetensors',
            textEncoder1: './text_encoders/llava_llama3_fp16.safetensors',
            textEncoder2: './text_encoders/clip_l.safetensors',
            imageEncoder: './image_encoder/sigclip_vision_patch14_384.safetensors',
            epochs: '16',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '16',
            optimizer: 'adamw8bit',
            learningRate: '2e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            fp8Base: false,
            fp8Scaled: false,
            fp8Llm: false,
            blocksToSwap: '0',
            vaeChunkSize: '32',
            timestepSampling: 'shift',
            flowShift: '3.0',
            weightingScheme: 'none',
            workers: '2',
            attention: 'sdpa',
            cacheBatchSize: '16'
        }
    },
    'wan-22': {
        id: 'wan-22',
        name: 'WAN 2.2',
        description: 'Configure the dual-DiT WAN 2.2 training flow and its noise-stage boundary.',
        script: 'wan22_training_script.sh',
        trainer: 'wan_train_network.py',
        networkModule: 'networks.lora_wan',
        cpuThreads: 16,
        task: {
            label: 'Training task',
            helper: 'Choose the task that matches the downloaded DiT pair and dataset.',
            options: [
                { label: 'WAN 2.2 Text to Video 14B', value: 't2v-A14B' },
                { label: 'WAN 2.2 Image to Video 14B', value: 'i2v-A14B' },
                { label: 'WAN 2.1 Text to Video 1.3B', value: 't2v-1.3B' },
                { label: 'WAN 2.1 Text to Video 14B', value: 't2v-14B' },
                { label: 'WAN 2.1 Image to Video 14B', value: 'i2v-14B' },
                { label: 'WAN 2.1 Text to Image 14B', value: 't2i-14B' }
            ]
        },
        modelFields: [
            {
                key: 'dit',
                label: 'Low-noise DiT',
                helper: 'WAN 2.2 low-noise checkpoint.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'ditHigh',
                label: 'High-noise DiT',
                helper: 'WAN 2.2 high-noise checkpoint.',
                required: true,
                trainFlag: '--dit_high_noise'
            },
            {
                key: 'vae',
                label: 'WAN VAE',
                helper: 'Used for latent caching.',
                required: true
            },
            {
                key: 't5',
                label: 'UMT5-XXL encoder',
                helper: 'Used for text-encoder caching.',
                required: true
            }
        ],
        attentionOptions: [attention.sdpa, attention.xformers],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Use FP8 E4M3FN instead of FP16 when supported.',
                flag: '--fp8_base'
            }
        ],
        defaults: {
            ...commonDefaults,
            outputName: 'lora',
            loggingDir: './logs',
            task: 't2v-A14B',
            dit: './diffusion_models/wan2.2_t2v_low_noise_14B_fp16.safetensors',
            ditHigh: './diffusion_models/wan2.2_t2v_high_noise_14B_fp16.safetensors',
            vae: './vae/wan_2.1_vae.safetensors',
            t5: './text_encoders/models_t5_umt5-xxl-enc-bf16.pth',
            epochs: '1000',
            saveEvery: '10',
            networkDim: '64',
            networkAlpha: '64',
            optimizer: 'adamw',
            learningRate: '1e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'fp16',
            fp8Base: false,
            blocksToSwap: '',
            timestepSampling: 'logsnr',
            flowShift: '12.0',
            weightingScheme: '',
            guidanceScale: '1.0',
            timestepBoundary: '875',
            minTimestep: '0',
            maxTimestep: '1000',
            workers: '16',
            attention: 'sdpa',
            cacheBatchSize: '16',
            extraArgs: '--preserve_distribution_shape --log_with tensorboard'
        }
    },
    'flux-kontext': {
        id: 'flux-kontext',
        name: 'Flux Kontext Dev',
        description: 'Train a Flux.1 Kontext LoRA using the recommended FP8-scaled configuration.',
        script: 'flux_kontext_training_script.sh',
        trainer: 'flux_kontext_train_network.py',
        networkModule: 'networks.lora_flux',
        modelFields: [
            {
                key: 'dit',
                label: 'Flux Kontext DiT',
                helper: 'FP8-scaled Flux.1 Kontext checkpoint.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'Flux AE / VAE',
                helper: 'Used for latent caching and training.',
                required: true,
                trainFlag: '--vae'
            },
            {
                key: 'textEncoder1',
                label: 'T5-XXL encoder',
                helper: 'Primary text encoder.',
                required: true,
                trainFlag: '--text_encoder1'
            },
            {
                key: 'textEncoder2',
                label: 'CLIP-L encoder',
                helper: 'Secondary text encoder.',
                required: true,
                trainFlag: '--text_encoder2'
            }
        ],
        attentionOptions: [attention.sdpa, attention.xformers],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Required by the downloaded FP8-scaled DiT.',
                flag: '--fp8_base'
            },
            {
                key: 'fp8Scaled',
                label: 'FP8 scaled',
                helper: 'Keep enabled with the reference checkpoint.',
                flag: '--fp8_scaled'
            },
            {
                key: 'fp8T5',
                label: 'FP8 T5',
                helper: 'Optional extra VRAM reduction for T5.',
                flag: '--fp8_t5'
            }
        ],
        defaults: {
            ...commonDefaults,
            dit: './diffusion_models/flux1-dev-kontext_fp8_scaled.safetensors',
            vae: './vae/ae.safetensors',
            textEncoder1: './text_encoders/t5xxl_fp16.safetensors',
            textEncoder2: './text_encoders/clip_l.safetensors',
            epochs: '16',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '16',
            optimizer: 'adamw8bit',
            learningRate: '1e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            fp8Base: true,
            fp8Scaled: true,
            fp8T5: false,
            blocksToSwap: '0',
            timestepSampling: 'flux_shift',
            flowShift: '',
            weightingScheme: 'none',
            workers: '2',
            attention: 'sdpa',
            cacheBatchSize: '16'
        }
    },
    'qwen-image': {
        id: 'qwen-image',
        name: 'QWEN Image',
        description: 'Train a QWEN Image LoRA with cached Qwen2.5-VL conditioning.',
        script: 'qwen_image_training_script.sh',
        trainer: 'qwen_image_train_network.py',
        networkModule: 'networks.lora_qwen_image',
        modelFields: [
            {
                key: 'dit',
                label: 'QWEN Image DiT',
                helper: 'Diffusion checkpoint used by the trainer.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'QWEN Image VAE',
                helper: 'Used for latent caching.',
                required: true
            },
            {
                key: 'textEncoder',
                label: 'Qwen2.5-VL encoder',
                helper: 'Used for text-encoder caching.',
                required: true
            }
        ],
        attentionOptions: [attention.xformers, attention.sdpa],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Enabled by the reference script for lower VRAM.',
                flag: '--fp8_base'
            },
            {
                key: 'fp8Scaled',
                label: 'FP8 scaled',
                helper: 'Optional scaled FP8 mode.',
                flag: '--fp8_scaled'
            },
            {
                key: 'textEncoderCpu',
                label: 'Text encoder on CPU',
                helper: 'Useful near the 16 GB VRAM range.',
                flag: '--text_encoder_cpu'
            },
            {
                key: 'vaeEnableTiling',
                label: 'VAE tiling',
                helper: 'Reduce latent-cache VRAM usage.',
                flag: '--vae_enable_tiling'
            }
        ],
        defaults: {
            ...commonDefaults,
            dit: './diffusion_models/qwen_image_bf16.safetensors',
            vae: './vae/qwen_image_vae.safetensors',
            textEncoder: './text_encoders/qwen_2.5_vl_7b.safetensors',
            epochs: '10',
            saveEvery: '1',
            networkDim: '16',
            networkAlpha: '16',
            optimizer: 'adamw',
            learningRate: '1e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            fp8Base: true,
            fp8Scaled: false,
            textEncoderCpu: false,
            vaeEnableTiling: false,
            blocksToSwap: '0',
            timestepSampling: 'shift',
            flowShift: '3.0',
            weightingScheme: 'none',
            workers: '2',
            attention: 'xformers',
            cacheBatchSize: '16'
        }
    },
    'flux-2': {
        id: 'flux-2',
        name: 'FLUX.2',
        description: 'Train FLUX.2 dev or Klein LoRAs with the model-specific cache pipeline.',
        script: 'flux2_training_script.sh',
        trainer: 'flux_2_train_network.py',
        networkModule: 'networks.lora_flux_2',
        selectors: [
            {
                key: 'modelVersion',
                label: 'Model version',
                helper: 'The checkpoint and text encoder must match this FLUX.2 variant.',
                trainFlag: '--model_version',
                options: [
                    { label: 'Dev', value: 'dev' },
                    { label: 'Klein 4B', value: 'klein-4b' },
                    { label: 'Klein Base 4B', value: 'klein-base-4b' },
                    { label: 'Klein 9B', value: 'klein-9b' },
                    { label: 'Klein Base 9B', value: 'klein-base-9b' }
                ]
            }
        ],
        modelFields: [
            {
                key: 'dit',
                label: 'FLUX.2 DiT',
                helper: 'FLUX.2 checkpoint matching the selected model version.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'FLUX.2 VAE',
                helper: 'VAE used for caching and training.',
                required: true,
                trainFlag: '--vae'
            },
            {
                key: 'textEncoder',
                label: 'Text encoder',
                helper: 'Mistral 3 for dev or Qwen3 for Klein.',
                required: true,
                trainFlag: '--text_encoder'
            }
        ],
        cacheCommands: [
            {
                script: 'flux_2_cache_latents.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--vae', key: 'vae' },
                    { flag: '--model_version', key: 'modelVersion' }
                ]
            },
            {
                script: 'flux_2_cache_text_encoder_outputs.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--text_encoder', key: 'textEncoder' },
                    { flag: '--batch_size', key: 'cacheBatchSize' },
                    { flag: '--model_version', key: 'modelVersion' }
                ]
            }
        ],
        attentionOptions: [attention.sdpa, attention.xformers, attention.flash],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Keep enabled with the downloaded FP8-mixed checkpoint.',
                flag: '--fp8_base'
            },
            {
                key: 'fp8Scaled',
                label: 'FP8 scaled',
                helper: 'Keep enabled with FP8 base for the reference checkpoint.',
                flag: '--fp8_scaled'
            },
            {
                key: 'fp8TextEncoder',
                label: 'FP8 text encoder',
                helper: 'Only valid for Klein variants that use Qwen3.',
                flag: '--fp8_text_encoder'
            }
        ],
        defaults: {
            ...commonDefaults,
            modelVersion: 'dev',
            dit: './diffusion_models/flux2_dev_fp8mixed.safetensors',
            vae: './vae/flux2-vae.safetensors',
            textEncoder: './text_encoders/mistral_3_small_flux2_bf16.safetensors',
            epochs: '16',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '16',
            optimizer: 'adamw8bit',
            learningRate: '1e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            fp8Base: true,
            fp8Scaled: true,
            fp8TextEncoder: false,
            blocksToSwap: '0',
            timestepSampling: 'flux2_shift',
            flowShift: '',
            weightingScheme: 'none',
            workers: '2',
            attention: 'sdpa',
            cacheBatchSize: '16'
        }
    },
    'framepack-one-frame': {
        id: 'framepack-one-frame',
        name: 'FramePack One-Frame',
        description: 'Train FramePack single-frame / kisekaeichi LoRAs with matching cache flags.',
        script: 'framepack_1f_training_script.sh',
        trainer: 'fpack_train_network.py',
        networkModule: 'networks.lora_framepack',
        modelFields: [
            {
                key: 'dit',
                label: 'DiT first shard',
                helper: 'Select shard 00001; the remaining shards must be beside it.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'HunyuanVideo VAE',
                helper: 'Used for the one-frame latent cache and training.',
                required: true,
                trainFlag: '--vae'
            },
            {
                key: 'textEncoder1',
                label: 'LLaVA-LLaMA3 encoder',
                helper: 'Primary text encoder.',
                required: true,
                trainFlag: '--text_encoder1'
            },
            {
                key: 'textEncoder2',
                label: 'CLIP-L encoder',
                helper: 'Secondary text encoder.',
                required: true,
                trainFlag: '--text_encoder2'
            },
            {
                key: 'imageEncoder',
                label: 'SigLIP image encoder',
                helper: 'Provides the required start-image conditioning.',
                required: true,
                trainFlag: '--image_encoder'
            }
        ],
        cacheCommands: [
            {
                script: 'fpack_cache_latents.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--vae', key: 'vae' },
                    { flag: '--image_encoder', key: 'imageEncoder' },
                    { flag: '--vae_chunk_size', key: 'vaeChunkSize' },
                    { flag: '--one_frame' },
                    { flag: '--one_frame_no_2x', enabledKey: 'oneFrameNo2x' },
                    { flag: '--one_frame_no_4x', enabledKey: 'oneFrameNo4x' }
                ]
            },
            {
                script: 'fpack_cache_text_encoder_outputs.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--text_encoder1', key: 'textEncoder1' },
                    { flag: '--text_encoder2', key: 'textEncoder2' },
                    { flag: '--batch_size', key: 'cacheBatchSize' },
                    { flag: '--fp8_llm', enabledKey: 'fp8Llm' }
                ]
            }
        ],
        fixedTrainFlags: ['--one_frame'],
        attentionOptions: [attention.sdpa, attention.xformers],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Enable together with FP8 scaled for low VRAM.',
                flag: '--fp8_base'
            },
            {
                key: 'fp8Scaled',
                label: 'FP8 scaled',
                helper: 'Enable together with FP8 base.',
                flag: '--fp8_scaled'
            },
            {
                key: 'fp8Llm',
                label: 'FP8 LLaMA cache',
                helper: 'Reduce memory during text-encoder caching.',
                flag: '--fp8_llm',
                train: false
            },
            {
                key: 'oneFrameNo2x',
                label: 'One-frame no 2x',
                helper: 'Match the corresponding one-frame inference setting.',
                flag: '--one_frame_no_2x',
                train: false
            },
            {
                key: 'oneFrameNo4x',
                label: 'One-frame no 4x',
                helper: 'Match the corresponding one-frame inference setting.',
                flag: '--one_frame_no_4x',
                train: false
            }
        ],
        defaults: {
            ...commonDefaults,
            dit: './diffusion_models/diffusion_pytorch_model-00001-of-00003.safetensors',
            vae: './vae/hunyuan_video_vae_bf16.safetensors',
            textEncoder1: './text_encoders/llava_llama3_fp16.safetensors',
            textEncoder2: './text_encoders/clip_l.safetensors',
            imageEncoder: './image_encoder/sigclip_vision_patch14_384.safetensors',
            epochs: '16',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '16',
            optimizer: 'adamw8bit',
            learningRate: '2e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            fp8Base: false,
            fp8Scaled: false,
            fp8Llm: false,
            oneFrameNo2x: false,
            oneFrameNo4x: false,
            blocksToSwap: '0',
            vaeChunkSize: '32',
            timestepSampling: 'shift',
            flowShift: '3.0',
            weightingScheme: 'none',
            workers: '2',
            attention: 'sdpa',
            cacheBatchSize: '16'
        }
    },
    'wan-one-frame': {
        id: 'wan-one-frame',
        name: 'WAN One-Frame',
        description: 'Train WAN 2.1 single-frame LoRAs for I2V or intermediate-frame datasets.',
        script: 'wan_1f_training_script.sh',
        trainer: 'wan_train_network.py',
        networkModule: 'networks.lora_wan',
        task: {
            label: 'Training task',
            helper: 'Choose the task matching the WAN 2.1 checkpoint and one-frame dataset.',
            options: [
                { label: 'WAN 2.1 I2V 14B', value: 'i2v-14B' },
                { label: 'WAN 2.1 FLF2V 14B', value: 'flf2v-14B' }
            ]
        },
        modelFields: [
            {
                key: 'dit',
                label: 'WAN 2.1 DiT',
                helper: 'I2V-14B or FLF2V-14B checkpoint.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'WAN VAE',
                helper: 'Used for one-frame latent caching.',
                required: true
            },
            {
                key: 't5',
                label: 'UMT5-XXL encoder',
                helper: 'Used for text-encoder caching.',
                required: true
            }
        ],
        cacheCommands: [
            {
                script: 'wan_cache_latents.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--vae', key: 'vae' },
                    { flag: '--one_frame' }
                ]
            },
            {
                script: 'wan_cache_text_encoder_outputs.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--t5', key: 't5' },
                    { flag: '--batch_size', key: 'cacheBatchSize' }
                ]
            }
        ],
        fixedTrainFlags: ['--one_frame'],
        attentionOptions: [attention.sdpa, attention.xformers],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Use FP8 E4M3FN to reduce DiT memory.',
                flag: '--fp8_base'
            }
        ],
        defaults: {
            ...commonDefaults,
            loggingDir: './logs',
            task: 'i2v-14B',
            dit: './diffusion_models/wan2.1_i2v_480p_14B_fp16.safetensors',
            vae: './vae/wan_2.1_vae.safetensors',
            t5: './text_encoders/models_t5_umt5-xxl-enc-bf16.pth',
            epochs: '16',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '16',
            optimizer: 'adamw8bit',
            learningRate: '1e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            fp8Base: false,
            blocksToSwap: '0',
            timestepSampling: 'shift',
            flowShift: '3.0',
            weightingScheme: '',
            guidanceScale: '1.0',
            workers: '2',
            attention: 'sdpa',
            cacheBatchSize: '16'
        }
    },
    'z-image-turbo': {
        id: 'z-image-turbo',
        name: 'Z-Image',
        description: 'Train Z-Image LoRAs with Qwen3 conditioning and the Flux autoencoder.',
        script: 'z_image_turbo_training_script.sh',
        trainer: 'zimage_train_network.py',
        networkModule: 'networks.lora_zimage',
        modelFields: [
            {
                key: 'dit',
                label: 'Z-Image DiT',
                helper: 'BF16 Z-Image diffusion checkpoint.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'Flux autoencoder',
                helper: 'Used for latent caching.',
                required: true
            },
            {
                key: 'textEncoder',
                label: 'Qwen3 4B encoder',
                helper: 'Used for text-encoder caching.',
                required: true
            }
        ],
        cacheCommands: [
            {
                script: 'zimage_cache_latents.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--vae', key: 'vae' }
                ]
            },
            {
                script: 'zimage_cache_text_encoder_outputs.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--text_encoder', key: 'textEncoder' },
                    { flag: '--batch_size', key: 'cacheBatchSize' }
                ]
            }
        ],
        attentionOptions: [attention.sdpa, attention.xformers],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Enable together with FP8 scaled on lower-VRAM GPUs.',
                flag: '--fp8_base'
            },
            {
                key: 'fp8Scaled',
                label: 'FP8 scaled',
                helper: 'Enable together with FP8 base.',
                flag: '--fp8_scaled'
            },
            {
                key: 'textEncoderCpu',
                label: 'Text encoder on CPU',
                helper: 'Move the text encoder off the GPU to save VRAM.',
                flag: '--text_encoder_cpu'
            },
            {
                key: 'vaeEnableTiling',
                label: 'VAE tiling',
                helper: 'Reduce latent-cache memory use.',
                flag: '--vae_enable_tiling'
            }
        ],
        defaults: {
            ...commonDefaults,
            dit: './diffusion_models/z_image_bf16.safetensors',
            vae: './vae/ae.safetensors',
            textEncoder: './text_encoders/qwen_3_4b.safetensors',
            epochs: '10',
            saveEvery: '1',
            networkDim: '16',
            networkAlpha: '16',
            optimizer: 'adamw',
            learningRate: '1e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            fp8Base: false,
            fp8Scaled: false,
            textEncoderCpu: false,
            vaeEnableTiling: false,
            blocksToSwap: '0',
            timestepSampling: 'shift',
            flowShift: '2.0',
            weightingScheme: 'none',
            workers: '2',
            attention: 'sdpa',
            cacheBatchSize: '16'
        }
    },
    'hidream-o1': {
        id: 'hidream-o1',
        name: 'HiDream O1',
        description: 'Train HiDream O1 text-to-image or image-conditioned LoRAs.',
        script: 'hidream_o1_training_script.sh',
        trainer: 'hidream_o1_train_network.py',
        networkModule: 'networks.lora_hidream_o1',
        task: {
            label: 'Training task',
            helper: 'I2I visual convolution layers may also need conv_dim and conv_alpha.',
            options: [
                { label: 'Text to Image', value: 't2i' },
                { label: 'Image to Image', value: 'i2i' }
            ]
        },
        selectors: [
            {
                key: 'modelType',
                label: 'Model type',
                helper: 'Dev uses a different recommended noise schedule from Full.',
                trainFlag: '--model_type',
                options: [
                    { label: 'Full', value: 'full' },
                    { label: 'Dev', value: 'dev' }
                ]
            }
        ],
        modelFields: [
            {
                key: 'dit',
                label: 'HiDream O1 DiT',
                helper: 'The VAE and text encoders are loaded from the official model repository.',
                required: true,
                trainFlag: '--dit'
            }
        ],
        advancedFields: [
            {
                key: 'noiseScaleStart',
                label: 'Noise scale start',
                helper: 'Reference Full default is 8.0; Dev recommends 7.5.',
                trainFlag: '--noise_scale_start'
            },
            {
                key: 'noiseScaleEnd',
                label: 'Noise scale end',
                helper: 'Reference Full default is 8.0; Dev recommends 7.5.',
                trainFlag: '--noise_scale_end'
            },
            {
                key: 'noiseClipStd',
                label: 'Noise clip standard deviation',
                helper: 'Reference Full default is 0.0; Dev recommends 2.5.',
                trainFlag: '--noise_clip_std'
            }
        ],
        cacheCommands: [
            {
                script: 'hidream_o1_cache_pixel.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--batch_size', key: 'cachePixelBatchSize' }
                ]
            },
            {
                script: 'hidream_o1_cache_text_encoder_outputs.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--batch_size', key: 'cacheBatchSize' },
                    { flag: '--model_type', key: 'modelType' }
                ]
            }
        ],
        attentionOptions: [attention.sdpa, attention.flash],
        memoryFlags: [
            {
                key: 'pinnedBlockSwap',
                label: 'Pinned block-swap memory',
                helper: 'May increase shared GPU memory use on Windows.',
                flag: '--use_pinned_memory_for_block_swap'
            }
        ],
        defaults: {
            ...commonDefaults,
            task: 't2i',
            modelType: 'full',
            dit: './diffusion_models/hidream_o1_image_bf16.safetensors',
            epochs: '16',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '16',
            optimizer: 'adamw8bit',
            learningRate: '4e-5',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            pinnedBlockSwap: false,
            blocksToSwap: '0',
            timestepSampling: 'uniform',
            flowShift: '',
            weightingScheme: 'none',
            noiseScaleStart: '8.0',
            noiseScaleEnd: '8.0',
            noiseClipStd: '0.0',
            workers: '2',
            attention: 'sdpa',
            cachePixelBatchSize: '1',
            cacheBatchSize: '16'
        }
    },
    'hunyuan-video-1-5': {
        id: 'hunyuan-video-1-5',
        name: 'HunyuanVideo 1.5',
        description: 'Train HunyuanVideo 1.5 T2V or I2V LoRAs with Qwen and ByT5 caches.',
        script: 'hunyuan_video_1_5_training_script.sh',
        trainer: 'hv_1_5_train_network.py',
        networkModule: 'networks.lora_hv_1_5',
        task: {
            label: 'Training task',
            helper: 'I2V adds SigLIP first-frame conditioning to the latent cache.',
            options: [
                { label: 'Text to Video', value: 't2v' },
                { label: 'Image to Video', value: 'i2v' }
            ]
        },
        modelFields: [
            {
                key: 'dit',
                label: 'HunyuanVideo 1.5 DiT',
                helper: 'Use the checkpoint matching the selected T2V or I2V task.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'HunyuanVideo 1.5 VAE',
                helper: 'Used for caching and training.',
                required: true,
                trainFlag: '--vae'
            },
            {
                key: 'textEncoder',
                label: 'Qwen2.5-VL encoder',
                helper: 'Primary text encoder.',
                required: true,
                trainFlag: '--text_encoder'
            },
            {
                key: 'byt5',
                label: 'ByT5 glyph encoder',
                helper: 'Secondary glyph-aware text encoder.',
                required: true,
                trainFlag: '--byt5'
            },
            {
                key: 'imageEncoder',
                label: 'SigLIP image encoder',
                helper: 'Required only for image-to-video training.',
                required: true,
                trainFlag: '--image_encoder',
                when: { key: 'task', value: 'i2v' }
            }
        ],
        cacheCommands: [
            {
                script: 'hv_1_5_cache_latents.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--vae', key: 'vae' },
                    { flag: '--i2v', when: { key: 'task', value: 'i2v' } },
                    {
                        flag: '--image_encoder',
                        key: 'imageEncoder',
                        when: { key: 'task', value: 'i2v' }
                    }
                ]
            },
            {
                script: 'hv_1_5_cache_text_encoder_outputs.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--text_encoder', key: 'textEncoder' },
                    { flag: '--byt5', key: 'byt5' },
                    { flag: '--batch_size', key: 'cacheBatchSize' },
                    { flag: '--fp8_vl', enabledKey: 'fp8Vl' }
                ]
            }
        ],
        attentionOptions: [attention.sdpa, attention.flash, attention.xformers],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Enable together with FP8 scaled for low VRAM.',
                flag: '--fp8_base'
            },
            {
                key: 'fp8Scaled',
                label: 'FP8 scaled',
                helper: 'Enable together with FP8 base.',
                flag: '--fp8_scaled'
            },
            {
                key: 'fp8Vl',
                label: 'FP8 Qwen cache',
                helper: 'Run Qwen2.5-VL in FP8 during text caching.',
                flag: '--fp8_vl',
                train: false
            },
            {
                key: 'splitAttn',
                label: 'Split attention',
                helper: 'Save a small amount of additional VRAM.',
                flag: '--split_attn'
            }
        ],
        defaults: {
            ...commonDefaults,
            task: 't2v',
            dit: './diffusion_models/hunyuanvideo1.5_720p_t2v.safetensors',
            vae: './vae/hunyuanvideo15_vae.safetensors',
            textEncoder: './text_encoders/qwen_2.5_vl_7b.safetensors',
            byt5: './text_encoders/byt5_small_glyphxl_fp16.safetensors',
            imageEncoder: './image_encoder/sigclip_vision_patch14_384.safetensors',
            epochs: '16',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '16',
            optimizer: 'adamw8bit',
            learningRate: '1e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            fp8Base: false,
            fp8Scaled: false,
            fp8Vl: false,
            splitAttn: false,
            blocksToSwap: '0',
            timestepSampling: 'shift',
            flowShift: '2.0',
            weightingScheme: 'none',
            workers: '2',
            attention: 'sdpa',
            cacheBatchSize: '16'
        }
    },
    'ideogram-4': {
        id: 'ideogram-4',
        name: 'Ideogram 4',
        description: 'Train Ideogram 4 LoRAs with its permanently-FP8 DiT and Qwen3-VL cache.',
        script: 'ideogram4_training_script.sh',
        trainer: 'ideogram4_train_network.py',
        networkModule: 'networks.lora_ideogram4',
        modelFields: [
            {
                key: 'dit',
                label: 'Ideogram 4 DiT',
                helper: 'Permanently-FP8 conditional DiT; do not add FP8 base.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'FLUX.2 VAE',
                helper: 'Used for BF16 latent caching.',
                required: true
            },
            {
                key: 'textEncoder',
                label: 'Qwen3-VL 8B encoder',
                helper: 'Used for BF16 text cache generation.',
                required: true
            }
        ],
        cacheCommands: [
            {
                script: 'ideogram4_cache_latents.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--vae', key: 'vae' },
                    { flag: '--vae_dtype', value: 'bfloat16' }
                ]
            },
            {
                script: 'ideogram4_cache_text_encoder_outputs.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--text_encoder', key: 'textEncoder' },
                    { flag: '--text_cache_dtype', value: 'bf16' }
                ]
            }
        ],
        attentionOptions: [attention.sdpa, attention.flash, attention.xformers],
        memoryFlags: [],
        defaults: {
            ...commonDefaults,
            dit: './diffusion_models/ideogram4_fp8_scaled.safetensors',
            vae: './vae/flux2-vae.safetensors',
            textEncoder: './text_encoders/qwen3vl_8b_fp8_scaled.safetensors',
            epochs: '16',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '16',
            optimizer: 'adamw8bit',
            learningRate: '1e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            blocksToSwap: '0',
            timestepSampling: 'ideogram4_shift',
            flowShift: '',
            weightingScheme: 'none',
            workers: '2',
            attention: 'sdpa',
            cacheBatchSize: '16'
        }
    },
    'kandinsky-5': {
        id: 'kandinsky-5',
        name: 'Kandinsky 5',
        description: 'Train Kandinsky 5 Pro video LoRAs with Qwen and CLIP conditioning.',
        script: 'kandinsky5_training_script.sh',
        trainer: 'kandinsky5_train_network.py',
        networkModule: 'networks.lora_kandinsky',
        task: {
            label: 'Task preset',
            helper: 'I2V requires the matching I2V DiT checkpoint.',
            options: [
                { label: 'Pro T2V 5s SD', value: 'k5-pro-t2v-5s-sd' },
                { label: 'Pro I2V 5s SD', value: 'k5-pro-i2v-5s-sd' }
            ]
        },
        modelFields: [
            {
                key: 'dit',
                label: 'Kandinsky 5 DiT',
                helper: 'Checkpoint matching the selected task preset.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'HunyuanVideo 3D VAE',
                helper: 'Used for caching and training.',
                required: true,
                trainFlag: '--vae'
            },
            {
                key: 'textEncoderQwen',
                label: 'Qwen text encoder',
                helper: 'Hugging Face model ID or local snapshot directory.',
                required: true,
                trainFlag: '--text_encoder_qwen'
            },
            {
                key: 'textEncoderClip',
                label: 'CLIP text encoder',
                helper: 'Hugging Face model ID or local snapshot directory.',
                required: true,
                trainFlag: '--text_encoder_clip'
            }
        ],
        advancedFields: [
            {
                key: 'maxGradNorm',
                label: 'Maximum gradient norm',
                helper: 'Gradient clipping threshold.',
                trainFlag: '--max_grad_norm'
            },
            {
                key: 'schedulerScale',
                label: 'Scheduler scale',
                helper: 'Keep aligned with the selected task configuration.',
                trainFlag: '--scheduler_scale'
            }
        ],
        cacheCommands: [
            {
                script: 'kandinsky5_cache_latents.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--vae', key: 'vae' }
                ]
            },
            {
                script: 'kandinsky5_cache_text_encoder_outputs.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--text_encoder_qwen', key: 'textEncoderQwen' },
                    { flag: '--text_encoder_clip', key: 'textEncoderClip' },
                    { flag: '--batch_size', key: 'cacheBatchSize' }
                ]
            }
        ],
        attentionOptions: [attention.sdpa, attention.flash, attention.sage, attention.xformers],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Reduce memory with a possible quality tradeoff.',
                flag: '--fp8_base'
            },
            {
                key: 'fp8Scaled',
                label: 'FP8 scaled',
                helper: 'Optional scaled FP8 mode.',
                flag: '--fp8_scaled'
            }
        ],
        defaults: {
            ...commonDefaults,
            task: 'k5-pro-t2v-5s-sd',
            dit: './diffusion_models/kandinsky5pro_t2v_sft_5s.safetensors',
            vae: './vae/hunyuan_video_vae.safetensors',
            textEncoderQwen: 'Qwen/Qwen2.5-VL-7B-Instruct',
            textEncoderClip: 'openai/clip-vit-large-patch14',
            epochs: '50',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '32',
            optimizer: 'adamw8bit',
            optimizerArgs: 'weight_decay=0.001 betas=(0.9,0.95)',
            learningRate: '1e-4',
            scheduler: 'constant_with_warmup',
            warmupSteps: '100',
            mixedPrecision: 'bf16',
            fp8Base: true,
            fp8Scaled: false,
            blocksToSwap: '0',
            timestepSampling: 'shift',
            flowShift: '5.0',
            weightingScheme: '',
            maxGradNorm: '1.0',
            schedulerScale: '10.0',
            workers: '1',
            attention: 'sdpa',
            cacheBatchSize: '4'
        }
    },
    'krea-2': {
        id: 'krea-2',
        name: 'Krea 2',
        description: 'Train Krea 2 RAW LoRAs with Qwen3-VL conditioning.',
        script: 'krea2_training_script.sh',
        trainer: 'krea2_train_network.py',
        networkModule: 'networks.lora_krea2',
        modelFields: [
            {
                key: 'dit',
                label: 'Krea 2 RAW DiT',
                helper: 'Krea 2 RAW diffusion checkpoint.',
                required: true,
                trainFlag: '--dit'
            },
            {
                key: 'vae',
                label: 'Qwen Image VAE',
                helper: 'Used for caching and training.',
                required: true,
                trainFlag: '--vae'
            },
            {
                key: 'textEncoder',
                label: 'Qwen3-VL 4B encoder',
                helper: 'Used for text-encoder caching.',
                required: true
            }
        ],
        cacheCommands: [
            {
                script: 'krea2_cache_latents.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--vae', key: 'vae' }
                ]
            },
            {
                script: 'krea2_cache_text_encoder_outputs.py',
                options: [
                    { flag: '--dataset_config', key: 'datasetConfig' },
                    { flag: '--text_encoder', key: 'textEncoder' },
                    { flag: '--batch_size', key: 'cacheBatchSize' }
                ]
            }
        ],
        attentionOptions: [attention.sdpa, attention.flash, attention.sage, attention.xformers],
        memoryFlags: [
            {
                key: 'fp8Base',
                label: 'FP8 base model',
                helper: 'Enable together with FP8 scaled for low VRAM.',
                flag: '--fp8_base'
            },
            {
                key: 'fp8Scaled',
                label: 'FP8 scaled',
                helper: 'Enable together with FP8 base.',
                flag: '--fp8_scaled'
            }
        ],
        defaults: {
            ...commonDefaults,
            dit: './diffusion_models/raw.safetensors',
            vae: './vae/qwen_image_vae.safetensors',
            textEncoder: './text_encoders/qwen3vl_4b_bf16.safetensors',
            epochs: '16',
            saveEvery: '1',
            networkDim: '32',
            networkAlpha: '32',
            optimizer: 'adamw8bit',
            learningRate: '1e-4',
            scheduler: 'cosine',
            warmupSteps: '0.05',
            mixedPrecision: 'bf16',
            fp8Base: false,
            fp8Scaled: false,
            blocksToSwap: '0',
            timestepSampling: 'shift',
            flowShift: '2.5',
            weightingScheme: 'none',
            workers: '2',
            attention: 'sdpa',
            cacheBatchSize: '1'
        }
    }
}
