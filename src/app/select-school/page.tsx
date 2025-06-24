'use client'
import { useEffect, useMemo, useState } from 'react'
import SchoolSwitcher from '@/components/SchoolSwitcher'
import { useAuth } from '@/context/AuthContext'

const SelectSchoolPage = () => {
  const { user } = useAuth()
  const schools = useMemo(() => user?.schools ?? [], [user?.schools])
  const [selectedSchool, setSelectedSchool] = useState<string | undefined>()
  useEffect(() => {
    // Get stored school from session storage on component mount
    const storedSchool = sessionStorage.getItem('selectedSchool')
    if (storedSchool) {
      setSelectedSchool(JSON.parse(storedSchool).schoolId)
    }
  }, [])

  useEffect(() => {
    // Store selected school in session storage when it changes
    if (selectedSchool) {
      const school = schools.find(school => school.schoolId === selectedSchool)
      document.cookie = `selectedSchoolId=${selectedSchool}; path=/`;
      sessionStorage.setItem('selectedSchool', school ? JSON.stringify(school) : '' )
    }
  }, [schools, selectedSchool])

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <SchoolSwitcher schools={schools} selectedSchool={selectedSchool} setSelectedSchool={setSelectedSchool} />
    </main>
  )
}

export default SelectSchoolPage