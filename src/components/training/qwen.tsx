import { trainingProfiles } from './profiles'
import TrainingWorkspace from './shared/training_workspace'

const QwenTrainer = () => <TrainingWorkspace profile={trainingProfiles['qwen-image']} />

export default QwenTrainer
