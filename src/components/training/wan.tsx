import AdvancedSettings from './shared/advanced_settings'
import HuggingfaceUpload from './shared/hf_upload'
import LearningRate from './shared/learning_rate'
import LoRANetwork from './shared/network'
import Optimizer from './shared/optimizer'
import TrainingOutput from './shared/output'
import TrainingButton from './shared/training_button'
import WanModelLoader from './wan/wan_model_loader'
import WanTask from './wan/wan_task'
import { Typography } from '@material-tailwind/react'

const WanTrainer = () => (
    <div className="flex flex-col gap-3 m-3">
        <Typography variant="h1" className="ml-5">
            WAN Train Network LoRA
        </Typography>
        <div className="flex flex-col gap-3 mb-5">
            <WanTask />
            <WanModelLoader />
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

export default WanTrainer
