import type { ElementType, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/core/utils/utils"
import {
    ROUTE_CONTAINER_CLASS_NAMES,
    ROUTE_VIEWPORT_CLASS_NAME,
    type RouteContainerIntent,
} from "./route-container-contract"

type ContainerElement = "article" | "div" | "main" | "section"

type ContainerProps = HTMLAttributes<HTMLElement> & {
    as?: ContainerElement
    children: ReactNode
}

type RouteShellContainerProps = ContainerProps & {
    intent: RouteContainerIntent
}

function Container({
    as = "div",
    children,
    className,
    ...props
}: ContainerProps & { className: string }) {
    const Component = as as ElementType
    return (
        <Component className={className} {...props}>
            {children}
        </Component>
    )
}

export function RouteViewportContainer({ children, className, ...props }: ContainerProps) {
    return (
        <Container className={cn(ROUTE_VIEWPORT_CLASS_NAME, className)} {...props}>
            {children}
        </Container>
    )
}

export function RouteShellContainer({ intent, children, className, ...props }: RouteShellContainerProps) {
    return (
        <Container
            className={cn(ROUTE_CONTAINER_CLASS_NAMES[intent], className)}
            data-route-container-intent={intent}
            {...props}
        >
            {children}
        </Container>
    )
}

export function ToolPageContainer({ children, className, ...props }: ContainerProps) {
    return (
        <RouteShellContainer className={className} data-page-container="tool" intent="tool" {...props}>
            {children}
        </RouteShellContainer>
    )
}

export function WideToolPageContainer({ children, className, ...props }: ContainerProps) {
    return (
        <RouteShellContainer className={className} data-page-container="wide-tool" intent="wide-tool" {...props}>
            {children}
        </RouteShellContainer>
    )
}

export function StaticPageContainer({ children, className, ...props }: ContainerProps) {
    return (
        <RouteShellContainer className={className} data-page-container="static" intent="static" {...props}>
            {children}
        </RouteShellContainer>
    )
}

export function CatalogPageContainer({ children, className, ...props }: ContainerProps) {
    return (
        <RouteShellContainer className={className} data-page-container="catalog" intent="catalog" {...props}>
            {children}
        </RouteShellContainer>
    )
}
