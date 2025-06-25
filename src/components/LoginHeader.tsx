const LoginHeader = ({ description }: { description: string }) => {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold">EntryPoint</h1>
      {description && (
        <p className="mt-2 text-gray-600">
          {description}
        </p>
      )}
    </div>
  );
};

export default LoginHeader;
