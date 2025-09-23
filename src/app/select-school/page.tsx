'use client'
import { useEffect, useMemo, useState } from 'react'
import SchoolSwitcher from '@/components/SchoolSwitcher'
import { useAuth } from '@/context/AuthContext'
import { refreshSuperProperties } from '@/libs/mixpanelClient'
import { loadSelectedSchool, saveSelectedSchool } from '@/utils/selectedSchoolStorage'

const SelectSchoolPage = () => {
  const { user } = useAuth()
  const schools = useMemo(() => user?.schools ?? [], [user?.schools])
  const [selectedSchool, setSelectedSchool] = useState<string | undefined>()
  useEffect(() => {
    const storedSchool = loadSelectedSchool()
    if (storedSchool?.schoolId) {
      setSelectedSchool(storedSchool.schoolId)
    }
  }, [])

  useEffect(() => {
    // Store selected school in session storage when it changes
    if (selectedSchool) {
      const school = schools.find(school => school.schoolId === selectedSchool)
      if (school) {
        saveSelectedSchool(school)
      }
      refreshSuperProperties();
    }
  }, [schools, selectedSchool])

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <SchoolSwitcher schools={schools} selectedSchool={selectedSchool} setSelectedSchool={setSelectedSchool} />
    </main>
  )
}

export default SelectSchoolPage
