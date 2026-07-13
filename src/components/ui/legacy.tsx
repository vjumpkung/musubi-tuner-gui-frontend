import { Button as ShadcnButton } from '@/components/ui/button'
import { Card as ShadcnCard, CardContent } from '@/components/ui/card'
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input as ShadcnInput } from '@/components/ui/input'
import { Progress as ShadcnProgress } from '@/components/ui/progress'
import {
    Select as ShadcnSelect,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { LoaderCircleIcon } from 'lucide-react'
import {
    Children,
    createElement,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
    type TextareaHTMLAttributes
} from 'react'

type LegacyColor = 'amber' | 'blue' | 'blue-gray' | 'green' | 'indigo' | 'red' | 'white'

type TypographyProps = HTMLAttributes<HTMLElement> & {
    as?: keyof HTMLElementTagNameMap
    color?: LegacyColor
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'lead' | 'paragraph' | 'small'
}

const typographyTags: Record<
    NonNullable<TypographyProps['variant']>,
    keyof HTMLElementTagNameMap
> = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    lead: 'p',
    paragraph: 'p',
    small: 'span'
}

const typographyClasses: Record<NonNullable<TypographyProps['variant']>, string> = {
    h1: 'text-3xl font-semibold tracking-tight sm:text-4xl',
    h2: 'text-2xl font-semibold tracking-tight sm:text-3xl',
    h3: 'text-xl font-semibold tracking-tight',
    h4: 'text-lg font-semibold tracking-tight',
    h5: 'text-base font-semibold',
    h6: 'text-sm font-semibold',
    lead: 'text-lg text-muted-foreground',
    paragraph: 'text-sm leading-6',
    small: 'text-xs'
}

function Typography({
    as,
    className,
    color: _color,
    variant = 'paragraph',
    ...props
}: TypographyProps) {
    return createElement(as ?? typographyTags[variant], {
        className: cn(typographyClasses[variant], className),
        ...props
    })
}

type ButtonProps = Omit<React.ComponentProps<typeof ShadcnButton>, 'size' | 'variant'> & {
    color?: LegacyColor
    fullWidth?: boolean
    loading?: boolean
    size?: 'sm' | 'md' | 'lg'
    variant?: 'filled' | 'gradient' | 'outlined' | 'text'
}

function Button({
    children,
    className,
    color,
    disabled,
    fullWidth,
    loading,
    size = 'md',
    variant = 'filled',
    ...props
}: ButtonProps) {
    const shadcnVariant =
        color === 'red'
            ? 'destructive'
            : variant === 'outlined'
              ? 'outline'
              : variant === 'text'
                ? 'ghost'
                : 'default'

    return (
        <ShadcnButton
            className={cn(fullWidth && 'w-full', className)}
            disabled={disabled || loading}
            size={size === 'md' ? 'default' : size}
            variant={shadcnVariant}
            {...props}
        >
            {loading ? (
                <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
            ) : null}
            {children}
        </ShadcnButton>
    )
}

type IconButtonProps = Omit<ButtonProps, 'children' | 'size'> & {
    children: ReactNode
    size?: 'sm' | 'md' | 'lg'
}

function IconButton({ size = 'md', ...props }: IconButtonProps) {
    const iconSize = size === 'sm' ? 'icon-sm' : size === 'lg' ? 'icon-lg' : 'icon'
    const {
        className,
        color,
        fullWidth: _fullWidth,
        loading: _loading,
        variant,
        ...buttonProps
    } = props
    const shadcnVariant =
        color === 'red' ? 'destructive' : variant === 'outlined' ? 'outline' : 'ghost'

    return (
        <ShadcnButton
            className={className}
            size={iconSize}
            variant={shadcnVariant}
            {...buttonProps}
        />
    )
}

function Card({ className, ...props }: React.ComponentProps<typeof ShadcnCard>) {
    return <ShadcnCard className={cn('py-0', className)} {...props} />
}

function CardBody({ className, ...props }: React.ComponentProps<typeof CardContent>) {
    return <CardContent className={className} {...props} />
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
    containerProps?: HTMLAttributes<HTMLDivElement>
    error?: boolean
    icon?: ReactNode
    label?: string
    size?: 'md' | 'lg'
}

function Input({
    className,
    containerProps,
    error,
    icon,
    id,
    label,
    size: _size,
    ...props
}: InputProps) {
    const inputId =
        id ?? (label ? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)

    return (
        <Field className={containerProps?.className} data-invalid={error || undefined}>
            {label ? <FieldLabel htmlFor={inputId}>{label}</FieldLabel> : null}
            <div className="relative">
                {icon ? (
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 [&>svg]:size-4">
                        {icon}
                    </span>
                ) : null}
                <ShadcnInput
                    className={cn('h-10', icon && 'pl-8', className)}
                    id={inputId}
                    aria-invalid={error || undefined}
                    {...props}
                />
            </div>
        </Field>
    )
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: boolean
    label?: string
    size?: 'md' | 'lg'
}

function Textarea({ className, error, id, label, size: _size, ...props }: TextareaProps) {
    const textareaId =
        id ?? (label ? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)

    return (
        <Field data-invalid={error || undefined}>
            {label ? <FieldLabel htmlFor={textareaId}>{label}</FieldLabel> : null}
            <ShadcnTextarea
                className={className}
                id={textareaId}
                aria-invalid={error || undefined}
                {...props}
            />
        </Field>
    )
}

type SelectProps = {
    children: ReactNode
    className?: string
    disabled?: boolean
    label?: string
    onChange?: (value?: string) => void
    size?: 'md' | 'lg'
    value?: string
}

function Select({ children, className, disabled, label, onChange, value }: SelectProps) {
    return (
        <Field>
            {label ? <FieldLabel>{label}</FieldLabel> : null}
            <ShadcnSelect disabled={disabled} onValueChange={onChange} value={value || undefined}>
                <SelectTrigger className={cn('h-10 w-full', className)}>
                    <SelectValue placeholder={label ?? 'Select an option'} />
                </SelectTrigger>
                <SelectContent position="popper">
                    <SelectGroup>{Children.toArray(children)}</SelectGroup>
                </SelectContent>
            </ShadcnSelect>
        </Field>
    )
}

function Option(props: React.ComponentProps<typeof SelectItem>) {
    return <SelectItem {...props} />
}

type CheckboxProps = Omit<React.ComponentProps<typeof ShadcnCheckbox>, 'onChange'> & {
    containerProps?: HTMLAttributes<HTMLDivElement>
    crossOrigin?: string
    label?: ReactNode
    onChange?: (event: { target: { checked: boolean } }) => void
}

function Checkbox({
    checked,
    containerProps,
    crossOrigin: _crossOrigin,
    id,
    label,
    onChange,
    ...props
}: CheckboxProps) {
    const checkboxId =
        id ??
        (typeof label === 'string'
            ? `check-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
            : undefined)

    return (
        <Field className={containerProps?.className} orientation="horizontal">
            <ShadcnCheckbox
                checked={checked}
                id={checkboxId}
                onCheckedChange={(next) => onChange?.({ target: { checked: next === true } })}
                {...props}
            />
            {label ? <FieldLabel htmlFor={checkboxId}>{label}</FieldLabel> : null}
        </Field>
    )
}

type ProgressProps = React.ComponentProps<typeof ShadcnProgress> & { color?: LegacyColor }

function Progress({ color: _color, ...props }: ProgressProps) {
    return <ShadcnProgress {...props} />
}

function Accordion({
    children,
    className,
    icon,
    open,
    ...props
}: HTMLAttributes<HTMLDivElement> & { icon?: ReactNode; open?: boolean }) {
    return (
        <div
            className={cn('group/legacy-accordion relative', className)}
            data-state={open ? 'open' : 'closed'}
            {...props}
        >
            {children}
            {icon ? (
                <span className="pointer-events-none absolute top-3 right-3">{icon}</span>
            ) : null}
        </div>
    )
}

function AccordionHeader({ className, ...props }: HTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={cn(
                'focus-visible:border-ring focus-visible:ring-ring/50 flex w-full items-center rounded-lg text-left outline-none focus-visible:ring-3',
                className
            )}
            {...props}
        />
    )
}

function AccordionBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('group-data-[state=closed]/legacy-accordion:hidden', className)}
            {...props}
        />
    )
}

function List({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col gap-1', className)} {...props} />
}

function ListItem({
    className,
    selected: _selected,
    ...props
}: HTMLAttributes<HTMLDivElement> & { selected?: boolean }) {
    return (
        <div
            role="button"
            tabIndex={0}
            className={cn(
                'hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-3',
                className
            )}
            {...props}
        />
    )
}

function ListItemPrefix({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn('text-muted-foreground shrink-0 [&>svg]:size-4', className)}
            {...props}
        />
    )
}

export {
    Accordion,
    AccordionBody,
    AccordionHeader,
    Button,
    Card,
    CardBody,
    Checkbox,
    IconButton,
    Input,
    List,
    ListItem,
    ListItemPrefix,
    Option,
    Progress,
    Select,
    Textarea,
    Typography
}
