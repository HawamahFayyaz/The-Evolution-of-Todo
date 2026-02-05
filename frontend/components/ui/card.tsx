import { type HTMLAttributes, type ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

/**
 * Reusable card component for content containers.
 *
 * @example
 * <Card>
 *   <h2>Card Title</h2>
 *   <p>Card content</p>
 * </Card>
 *
 * @example
 * <Card hover>
 *   <p>Interactive card with hover effect</p>
 * </Card>
 */
function Card({ className = "", hover = false, children, ...props }: CardProps) {
  const baseStyles = "bg-white rounded-xl shadow p-4 border border-gray-200";
  const hoverStyles = hover ? "hover:shadow-md transition-shadow duration-200" : "";

  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Card header component for titles and actions.
 */
function CardHeader({ className = "", children, ...props }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Card content component for main content area.
 */
function CardContent({ className = "", children, ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Card footer component for actions and metadata.
 */
function CardFooter({ className = "", children, ...props }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardContent, CardFooter };
