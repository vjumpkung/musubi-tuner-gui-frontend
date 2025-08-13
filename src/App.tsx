import SideBar from './components/sidebar'
import WanTrainer from './components/training/wan'

export default function App() {
    return (
        <div className="flex flex-row">
            <div className="h-screen w-full ml-80 mt-3 mr-3 mb-3">
                <WanTrainer />
            </div>
            <SideBar />
        </div>
    )
}
