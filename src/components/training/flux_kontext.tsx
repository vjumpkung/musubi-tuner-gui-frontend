import FluxKontextModelLoader from './model_specific/flux_kontext/flux_kontext_model_loader'
import AdvancedSettings from './shared/advanced_settings'
import HuggingfaceUpload from './shared/hf_upload'
import LearningRate from './shared/learning_rate'
import LoRANetwork from './shared/network'
import Optimizer from './shared/optimizer'
import TrainingOutput from './shared/output'
import TrainingButton from './shared/training_button'
import { Typography } from '@material-tailwind/react'

const FluxKontextTrainer = () => (
    <div className="flex flex-col gap-3 m-3">
        <Typography variant="h1" className="ml-5">
            Flux Kontext Dev Train Network LoRA
        </Typography>
        <div className="flex flex-col gap-3 mb-5">
            <FluxKontextModelLoader />
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

export default FluxKontextTrainer
