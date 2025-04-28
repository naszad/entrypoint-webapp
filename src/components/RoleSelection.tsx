import Link from "next/link";
const RoleSelection = () => {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-600">
        I am a:{" "}
        <Link
          href="/student/emma-johnson"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Student
        </Link>{" "}
        •{" "}
        <Link
          href="#"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Parent
        </Link>{" "}
        •{" "}
        <Link
          href="/counselor"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Counselor
        </Link>
      </p>
    </div>
  );
};

export default RoleSelection;
