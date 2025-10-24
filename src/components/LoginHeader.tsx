import Image from "next/image";

const LoginHeader = ({ description }: { description: string }) => {
  return (
    <div className="text-center">
      <Image
        width={500}
        height={300}
        src="/images/entry-point-logo.png"
        alt="EntryPoint SRM"
        className="mx-auto mb-2"
      />
      {description && (
        <p className="mt-2 text-gray-600">
          {description}
        </p>
      )}
    </div>
  );
};

export default LoginHeader;
