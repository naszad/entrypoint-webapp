import { cn } from "@/utils/utils"
import LoginHeader from "./LoginHeader"
import { Button } from "./ui/button"
import { redirect } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"

interface SchoolSwitcherProps {
    schools?: {
        name?: string
        schoolId?   : string
    }[]
    selectedSchool?: string
    setSelectedSchool: (school: string | undefined) => void
}

const SchoolSwitcher = ({schools, selectedSchool, setSelectedSchool}: SchoolSwitcherProps) => {
  const { handleLogout } = useAuth()
  return (
    <div className="max-w-md w-full space-y-8 bg-white rounded-md p-4 shadow-lg">
        {/* Header */}
        <LoginHeader description="Please select a school to continue" />
        {/* Login Form */}
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className='flex flex-col gap-2 overflow-y-auto max-h-[300px]'>
              {schools?.map((school) => (
                <div key={school.schoolId} onClick={() => setSelectedSchool(school.schoolId)} className={cn(selectedSchool === school.schoolId ? 'bg-blue-500 text-white' : 'border-2 border-gray-100', 'p-2 rounded-md cursor-pointer')}>
                  <span className='text-md'>{school.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className='flex flex-row gap-4 justify-center'>
          <Button
              variant="primary"
              className='w-[45%]'
                onClick={() => redirect('/students')}
            >
              <span className='text-lg'>Continue</span>
            </Button>
            <Button
              variant="outline"
              className='w-[45%]'
              onClick={handleLogout}
            >
              <span className='text-lg'>Logout</span>
            </Button>
          </div>

        </div>
      </div>
  )
}

export default SchoolSwitcher