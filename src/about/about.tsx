import { Badge } from '@/components/ui/badge'
import {
    Card as CreditCard,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Card, CardBody, Typography } from '@/components/ui/legacy'
import {
    RefreshCcwIcon as ArrowPathRoundedSquareIcon,
    BadgeCheckIcon as CheckBadgeIcon,
    SquareTerminalIcon as CommandLineIcon,
    FolderDownIcon as FolderArrowDownIcon,
    GitForkIcon,
    HeartIcon,
    ShieldCheckIcon,
    SparklesIcon
} from 'lucide-react'

const workflow = [
    {
        title: 'Configure with context',
        description:
            'Work through model files, training recipes, memory options, and publishing details without losing sight of what each setting changes.',
        icon: <SparklesIcon className="h-6 w-6" />
    },
    {
        title: 'Save a repeatable setup',
        description:
            'Export a portable JSON config for your next session, or import one to continue from a known starting point.',
        icon: <FolderArrowDownIcon className="h-6 w-6" />
    },
    {
        title: 'Review before you run',
        description:
            'Inspect the generated cache and training commands, confirm required paths, then copy them when the setup is ready.',
        icon: <CommandLineIcon className="h-6 w-6" />
    }
]

const About = () => (
    <main className="mx-auto w-full max-w-6xl p-3 pb-12 sm:p-5 sm:pb-12">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary px-6 py-10 text-primary-foreground shadow-lg sm:px-10 sm:py-14">
            <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-primary-foreground/10 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
            <div className="relative grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_12rem]">
                <div className="max-w-3xl">
                    <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
                        <HeartIcon className="h-4 w-4" />
                        Created by PixelLatent
                    </p>
                    <Typography variant="h1" color="white" className="max-w-2xl">
                        Complex model training, made easier to reason about.
                    </Typography>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-primary-foreground/90 sm:text-lg">
                        Musubi Tuner GUI brings trainer configuration, model downloads, launch
                        settings, and logs into one focused workspace—so you can spend less time
                        assembling commands and more time shaping the result.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 ring-1 ring-primary-foreground/20">
                            Configure
                        </span>
                        <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 ring-1 ring-primary-foreground/20">
                            Review
                        </span>
                        <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 ring-1 ring-primary-foreground/20">
                            Repeat
                        </span>
                    </div>
                </div>
                <div className="hidden justify-self-end rounded-3xl bg-primary-foreground/10 p-5 ring-1 ring-primary-foreground/20 backdrop-blur-sm md:block">
                    <img
                        src="/logo.png"
                        alt="Musubi Tuner GUI logo"
                        className="h-32 w-32 rounded-2xl object-contain"
                    />
                </div>
            </div>
        </header>

        <section className="py-10 sm:py-12">
            <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    A clearer path from idea to run
                </p>
                <Typography variant="h2" color="blue-gray" className="mt-2">
                    One workspace for the details that matter
                </Typography>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                    Training a LoRA involves dozens of connected choices. This interface organizes
                    them into a guided flow while keeping the final command visible and under your
                    control.
                </p>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-3">
                {workflow.map((item) => (
                    <Card key={item.title} className="border border-border shadow-sm">
                        <CardBody className="p-6">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary">
                                {item.icon}
                            </div>
                            <Typography variant="h5" color="blue-gray" className="mt-5">
                                {item.title}
                            </Typography>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {item.description}
                            </p>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
            <Card className="border border-border bg-muted shadow-none">
                <CardBody className="p-6 sm:p-7">
                    <div className="flex items-center gap-3">
                        <ArrowPathRoundedSquareIcon className="h-7 w-7 text-primary" />
                        <Typography variant="h4" color="blue-gray">
                            Built for iteration
                        </Typography>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        Experimentation works best when a good setup is easy to revisit. JSON
                        configs let you preserve trainer choices and acceleration settings, compare
                        approaches, and move a setup between browser sessions. Access tokens are
                        never included in exported files.
                    </p>
                </CardBody>
            </Card>

            <Card className="border border-border bg-muted shadow-none">
                <CardBody className="p-6 sm:p-7">
                    <div className="flex items-center gap-3">
                        <ShieldCheckIcon className="h-7 w-7 text-primary" />
                        <Typography variant="h4" color="blue-gray">
                            You stay in control
                        </Typography>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        The GUI prepares commands; your environment runs them. Always review paths,
                        model requirements, available VRAM, and optional dependencies before
                        starting a training job. The readiness panel is a guide, not a substitute
                        for validating your environment.
                    </p>
                </CardBody>
            </Card>
        </section>

        <section className="mt-10" aria-labelledby="credits-heading">
            <CreditCard>
                <CardHeader>
                    <CardTitle id="credits-heading">Credits</CardTitle>
                    <CardDescription className="max-w-3xl leading-6">
                        Musubi Tuner GUI is built around the open-source musubi-tuner training
                        toolkit created and maintained by kohya-ss.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Badge asChild variant="outline">
                        <a
                            href="https://github.com/kohya-ss/musubi-tuner"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <GitForkIcon data-icon="inline-start" />
                            kohya-ss/musubi-tuner
                        </a>
                    </Badge>
                </CardContent>
            </CreditCard>
        </section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-border pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <Typography variant="h5" color="blue-gray">
                    Musubi Tuner GUI
                </Typography>
                <p className="mt-1 text-sm text-muted-foreground">
                    A practical interface for thoughtful, repeatable training workflows.
                </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-success-foreground">
                <CheckBadgeIcon className="h-5 w-5" />
                Reviewable commands, portable configs
            </div>
        </footer>
    </main>
)

export default About
