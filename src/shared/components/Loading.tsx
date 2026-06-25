type LoadingProps = {
    message: string
}

export function Loading({ message } :LoadingProps) {
    return(
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-300">
          <svg
            className="w-14 h-14 text-emerald-500 mb-4 drop-shadow-sm"
            style={{ animation: "spin 1s linear infinite" }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            ></circle>
            <path
              className="opacity-100"
              fill="currentColor"
              d="M12 2a10 10 0 0 1 10 10"
            ></path>
          </svg>
          <p className="text-gray-800 dark:text-gray-100 font-bold text-lg animate-pulse drop-shadow-sm">
            {message}
          </p>
        </div>
    )
}