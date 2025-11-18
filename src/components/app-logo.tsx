export const AppLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-primary p-2 rounded-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary-foreground h-6 w-6"
        >
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 18a10 10 0 0 0-4.94-8.6" />
          <path d="M17 12a5 5 0 0 0-5-5" />
          <path d="m12 8-2 4" />
          <path d="m14 12-2 4" />
          <path d="m6 12-2 4" />
        </svg>
      </div>
      <h1 className="text-xl font-headline font-semibold text-foreground whitespace-nowrap">
        ExplainMate
      </h1>
    </div>
  );
};
