export type DownloadModel = {
    id: string
    name: string
    family: string
    task: string
    precision: string
    script: string
    description: string
    files: string[]
    trainingScripts?: string[]
    note?: string
}

export const downloadModels: DownloadModel[] = [
    {
        id: 'flux2-dev',
        name: 'FLUX.2 Dev',
        family: 'FLUX',
        task: 'Image',
        precision: 'FP8 mixed',
        script: 'download_flux2_dev.sh',
        description: 'FLUX.2 Dev DiT, VAE, and Mistral 3 Small text encoder.',
        files: [
            'diffusion_models/flux2_dev_fp8mixed.safetensors',
            'vae/flux2-vae.safetensors',
            'text_encoders/mistral_3_small_flux2_bf16.safetensors'
        ],
        trainingScripts: ['flux2_training_script.sh']
    },
    {
        id: 'flux-kontext-dev',
        name: 'FLUX.1 Kontext Dev',
        family: 'FLUX',
        task: 'Image edit',
        precision: 'FP8 scaled',
        script: 'download_flux_kontext_dev.sh',
        description: 'Kontext Dev DiT with FLUX VAE, T5-XXL, and CLIP-L encoders.',
        files: [
            'diffusion_models/flux1-dev-kontext_fp8_scaled.safetensors',
            'vae/ae.safetensors',
            'text_encoders/t5xxl_fp16.safetensors',
            'text_encoders/clip_l.safetensors'
        ],
        trainingScripts: ['flux_kontext_training_script.sh']
    },
    {
        id: 'framepack',
        name: 'FramePack I2V',
        family: 'FramePack',
        task: 'Image to video',
        precision: 'BF16 / FP16',
        script: 'download_framepack.sh',
        description: 'Three-shard FramePack DiT and all encoders required for I2V training.',
        files: [
            'diffusion_models/diffusion_pytorch_model-00001-of-00003.safetensors',
            'diffusion_models/diffusion_pytorch_model-00002-of-00003.safetensors',
            'diffusion_models/diffusion_pytorch_model-00003-of-00003.safetensors',
            'diffusion_models/diffusion_pytorch_model.safetensors.index.json',
            'vae/hunyuan_video_vae_bf16.safetensors',
            'text_encoders/llava_llama3_fp16.safetensors',
            'text_encoders/clip_l.safetensors',
            'image_encoder/sigclip_vision_patch14_384.safetensors'
        ],
        trainingScripts: ['framepack_training_script.sh', 'framepack_1f_training_script.sh']
    },
    {
        id: 'hidream-o1',
        name: 'HiDream O1 Image',
        family: 'HiDream',
        task: 'Image',
        precision: 'BF16',
        script: 'download_hidream_o1.sh',
        description: 'HiDream O1 image checkpoint for full-model training.',
        files: ['diffusion_models/hidream_o1_image_bf16.safetensors'],
        trainingScripts: ['hidream_o1_training_script.sh'],
        note: 'VAE and text encoders download from Hugging Face during the first cache or training run.'
    },
    {
        id: 'hunyuan-video',
        name: 'HunyuanVideo',
        family: 'HunyuanVideo',
        task: 'Text to video',
        precision: 'BF16 / FP16',
        script: 'download_hunyuan_video.sh',
        description: 'Original HunyuanVideo DiT, VAE, LLaVA-LLaMA3, and CLIP-L bundle.',
        files: [
            'diffusion_models/mp_rank_00_model_states.pt',
            'vae/pytorch_model.pt',
            'text_encoders/llava_llama3_fp16.safetensors',
            'text_encoders/clip_l.safetensors'
        ],
        trainingScripts: ['hunyuan_video_training_script.sh']
    },
    {
        id: 'hunyuan-video-1-5',
        name: 'HunyuanVideo 1.5',
        family: 'HunyuanVideo',
        task: 'T2V + I2V',
        precision: 'BF16 / FP16',
        script: 'download_hunyuan_video_1_5.sh',
        description: 'Both 720p DiTs plus VAE, Qwen2.5-VL, ByT5, and SigLIP encoders.',
        files: [
            'diffusion_models/hunyuanvideo1.5_720p_t2v.safetensors',
            'diffusion_models/hunyuanvideo1.5_720p_i2v.safetensors',
            'vae/hunyuanvideo15_vae.safetensors',
            'text_encoders/qwen_2.5_vl_7b.safetensors',
            'text_encoders/byt5_small_glyphxl_fp16.safetensors',
            'image_encoder/sigclip_vision_patch14_384.safetensors'
        ],
        trainingScripts: ['hunyuan_video_1_5_training_script.sh']
    },
    {
        id: 'ideogram-4',
        name: 'Ideogram 4',
        family: 'Ideogram',
        task: 'Image',
        precision: 'FP8 scaled',
        script: 'download_ideogram4.sh',
        description: 'Ideogram 4 DiT with FLUX.2 VAE and Qwen3-VL 8B encoder.',
        files: [
            'diffusion_models/ideogram4_fp8_scaled.safetensors',
            'vae/flux2-vae.safetensors',
            'text_encoders/qwen3vl_8b_fp8_scaled.safetensors'
        ],
        trainingScripts: ['ideogram4_training_script.sh'],
        note: 'The Qwen3-VL tokenizer downloads automatically during training.'
    },
    {
        id: 'kandinsky-5-t2v',
        name: 'Kandinsky 5 Pro T2V',
        family: 'Kandinsky',
        task: 'Text to video',
        precision: 'BF16',
        script: 'download_kandinsky5_t2v.sh',
        description: 'Kandinsky 5 Pro 5-second T2V checkpoint and HunyuanVideo VAE.',
        files: [
            'diffusion_models/kandinsky5pro_t2v_sft_5s.safetensors',
            'vae/hunyuan_video_vae.safetensors'
        ],
        trainingScripts: ['kandinsky5_training_script.sh'],
        note: 'Qwen2.5-VL and CLIP text encoders download automatically during training.'
    },
    {
        id: 'krea-2',
        name: 'Krea 2 RAW',
        family: 'Krea',
        task: 'Image',
        precision: 'BF16',
        script: 'download_krea2.sh',
        description: 'Krea 2 RAW checkpoint with Qwen-Image VAE and Qwen3-VL 4B encoder.',
        files: [
            'diffusion_models/raw.safetensors',
            'vae/qwen_image_vae.safetensors',
            'text_encoders/qwen3vl_4b_bf16.safetensors'
        ],
        trainingScripts: ['krea2_training_script.sh']
    },
    {
        id: 'qwen-image-bf16',
        name: 'Qwen Image',
        family: 'Qwen',
        task: 'Image',
        precision: 'BF16',
        script: 'download_qwen_image_fp16.sh',
        description: 'Base Qwen Image model with VAE and Qwen2.5-VL 7B encoder.',
        files: [
            'diffusion_models/qwen_image_bf16.safetensors',
            'vae/qwen_image_vae.safetensors',
            'text_encoders/qwen_2.5_vl_7b.safetensors'
        ],
        trainingScripts: ['qwen_image_training_script.sh']
    },
    {
        id: 'qwen-image-fp8',
        name: 'Qwen Image',
        family: 'Qwen',
        task: 'Image',
        precision: 'FP8 E4M3FN',
        script: 'download_qwen_image_fp8.sh',
        description: 'Lower-memory Qwen Image model with the standard VAE and encoder.',
        files: [
            'diffusion_models/qwen_image_fp8_e4m3fn.safetensors',
            'vae/qwen_image_vae.safetensors',
            'text_encoders/qwen_2.5_vl_7b.safetensors'
        ],
        trainingScripts: ['qwen_image_training_script.sh']
    },
    {
        id: 'qwen-image-edit',
        name: 'Qwen Image Edit',
        family: 'Qwen',
        task: 'Image edit',
        precision: 'BF16',
        script: 'download_qwen_image_edit_fp16.sh',
        description: 'Original Qwen Image Edit checkpoint with VAE and Qwen2.5-VL encoder.',
        files: [
            'diffusion_models/qwen_image_edit_bf16.safetensors',
            'vae/qwen_image_vae.safetensors',
            'text_encoders/qwen_2.5_vl_7b.safetensors'
        ]
    },
    {
        id: 'qwen-image-edit-2509',
        name: 'Qwen Image Edit 2509',
        family: 'Qwen',
        task: 'Image edit',
        precision: 'BF16',
        script: 'download_qwen_image_edit_2509_fp16.sh',
        description: 'September 2025 Qwen Image Edit checkpoint with VAE and encoder.',
        files: [
            'diffusion_models/qwen_image_edit_2509_bf16.safetensors',
            'vae/qwen_image_vae.safetensors',
            'text_encoders/qwen_2.5_vl_7b.safetensors'
        ]
    },
    {
        id: 'wan-2-1-t2v-14b',
        name: 'Wan 2.1 T2V 14B',
        family: 'Wan',
        task: 'Text to video',
        precision: 'BF16',
        script: 'download_wan21_t2v_14B_fp16.sh',
        description: 'Wan 2.1 T2V 14B checkpoint with shared VAE and UMT5-XXL encoder.',
        files: [
            'diffusion_models/wan2.1_t2v_14B_bf16.safetensors',
            'vae/wan_2.1_vae.safetensors',
            'text_encoders/models_t5_umt5-xxl-enc-bf16.pth'
        ]
    },
    {
        id: 'wan-2-1-i2v-14b',
        name: 'Wan 2.1 I2V 14B',
        family: 'Wan',
        task: 'Image to video',
        precision: 'FP16',
        script: 'download_wan21_i2v_14B_fp16.sh',
        description: 'Wan 2.1 I2V 480p 14B checkpoint with shared VAE and UMT5-XXL encoder.',
        files: [
            'diffusion_models/wan2.1_i2v_480p_14B_fp16.safetensors',
            'vae/wan_2.1_vae.safetensors',
            'text_encoders/models_t5_umt5-xxl-enc-bf16.pth'
        ],
        trainingScripts: ['wan_1f_training_script.sh']
    },
    {
        id: 'wan-2-2-t2v-14b',
        name: 'Wan 2.2 T2V 14B',
        family: 'Wan',
        task: 'Text to video',
        precision: 'FP16',
        script: 'download_wan22_t2v_14B_fp16.sh',
        description: 'Wan 2.2 T2V high- and low-noise checkpoints with VAE and encoder.',
        files: [
            'diffusion_models/wan2.2_t2v_low_noise_14B_fp16.safetensors',
            'diffusion_models/wan2.2_t2v_high_noise_14B_fp16.safetensors',
            'vae/wan_2.1_vae.safetensors',
            'text_encoders/models_t5_umt5-xxl-enc-bf16.pth'
        ],
        trainingScripts: ['wan22_training_script.sh']
    },
    {
        id: 'wan-2-2-i2v-14b',
        name: 'Wan 2.2 I2V 14B',
        family: 'Wan',
        task: 'Image to video',
        precision: 'FP16',
        script: 'download_wan22_i2v_14B_fp16.sh',
        description: 'Wan 2.2 I2V high- and low-noise checkpoints with VAE and encoder.',
        files: [
            'diffusion_models/wan2.2_i2v_low_noise_14B_fp16.safetensors',
            'diffusion_models/wan2.2_i2v_high_noise_14B_fp16.safetensors',
            'vae/wan_2.1_vae.safetensors',
            'text_encoders/models_t5_umt5-xxl-enc-bf16.pth'
        ]
    },
    {
        id: 'z-image-base',
        name: 'Z-Image Base',
        family: 'Z-Image',
        task: 'Image',
        precision: 'BF16',
        script: 'download_z_image_base_bf16.sh',
        description: 'Z-Image base checkpoint with AE VAE and Qwen3 4B encoder.',
        files: [
            'diffusion_models/z_image_bf16.safetensors',
            'vae/ae.safetensors',
            'text_encoders/qwen_3_4b.safetensors'
        ],
        note: 'The current Z-Image training script uses a different default checkpoint filename.'
    },
    {
        id: 'z-image-turbo',
        name: 'Z-Image Turbo',
        family: 'Z-Image',
        task: 'Image',
        precision: 'BF16',
        script: 'download_z_image_turbo_bf16.sh',
        description: 'Z-Image Turbo checkpoint with AE VAE and Qwen3 4B encoder.',
        files: [
            'diffusion_models/z_image_turbo_bf16.safetensors',
            'vae/ae.safetensors',
            'text_encoders/qwen_3_4b.safetensors'
        ],
        trainingScripts: ['z_image_turbo_training_script.sh']
    }
]

export const downloadFamilies = [
    'All families',
    ...Array.from(new Set(downloadModels.map((model) => model.family)))
]
