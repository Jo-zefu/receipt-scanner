export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className="flex items-center justify-center">
      <img
        src="/loader-cat.svg"
        alt="Loading..."
        className={sizeMap[size]}
      />
    </div>
  );
}
