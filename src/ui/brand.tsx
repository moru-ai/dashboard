import { cn } from '@/lib/utils'
import { Badge, BadgeProps } from '@/ui/primitives/badge'

export const MoruLogo = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={cn('size-8', className)}
    fill="none"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="50" cy="50" r="45" fill="currentColor" />
  </svg>
)

export const MoruBadge = ({ className, ...props }: BadgeProps) => (
  <Badge className={className} variant="default" {...props}>
    BY
    <MoruLogo className="size-3" />
  </Badge>
)
