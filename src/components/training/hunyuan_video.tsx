import HunyuanVideoModelLoader from './model_specific/hunyuan_video/hunyuan_video_model_loader'
import AdvancedSettings from './shared/advanced_settings'
import HuggingfaceUpload from './shared/hf_upload'
import LearningRate from './shared/learning_rate'
import LoRANetwork from './shared/network'
import Optimizer from './shared/optimizer'
import TrainingOutput from './shared/output'
import TrainingButton from './shared/training_button'
import { Typography } from '@material-tailwind/react'

const HunyuanVideoTrainer = () => (
    <div className="flex flex-col gap-3 m-3">
        <Typography variant="h1" className="ml-5">
            Hunyuan Video Train Network LoRA
        </Typography>
        <div className="flex flex-col gap-3 mb-5">
            <HunyuanVideoModelLoader />
            <TrainingOutput />
            <LoRANetwork />
            <Optimizer />
            <LearningRate />
            <AdvancedSettings />
            <HuggingfaceUpload />
            <TrainingButton />
        </div>
    </div>
)

export default HunyuanVideoTrainer
