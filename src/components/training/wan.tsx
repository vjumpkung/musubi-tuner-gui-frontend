import WanAdditional from './model_specific/wan/wan_additional'
import WanModelLoader from './model_specific/wan/wan_model_loader'
import WanTask from './model_specific/wan/wan_task'
import AdvancedSettings from './shared/advanced_settings'
import HuggingfaceUpload from './shared/hf_upload'
import LearningRate from './shared/learning_rate'
import LoRANetwork from './shared/network'
import Optimizer from './shared/optimizer'
import TrainingOutput from './shared/output'
import TrainingButton from './shared/training_button'
import { Typography } from '@material-tailwind/react'

const WanTrainer = () => (
    <div className="flex flex-col gap-3 m-3">
        <Typography variant="h1" className="ml-5">
            WAN Train Network LoRA
        </Typography>
        <div className="flex flex-col gap-3 mb-5">
            <WanModelLoader />
            <WanTask />
            <TrainingOutput />
            <LoRANetwork />
            <Optimizer />
            <LearningRate />
            <AdvancedSettings />
            <WanAdditional />
            <HuggingfaceUpload />
            <TrainingButton />
        </div>
    </div>
)

export default WanTrainer
