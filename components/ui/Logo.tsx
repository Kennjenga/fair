import Image from 'next/image';

interface LogoProps {
    size?: number;
    className?: string;
    showText?: boolean;
}

/**
 * FAIR Logo component
 * Displays the platform logo with optional text
 */
export const Logo = ({ size = 40, className = '', showText = true }: LogoProps) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative" style={{ width: size, height: size }}>
                <Image
                    src="/favicon.ico"
                    alt="FAIR Logo"
                    width={size}
                    height={size}
                    className="rounded-lg"
                    priority
                />
            </div>
            {showText && (
                <div className="text-2xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent">
                    FAIR
                </div>
            )}
        </div>
    );
};
