'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, User, Lock } from 'lucide-react'
import { notFound } from 'next/navigation'

interface ProfileUpdateData {
  firstName: string
  middleName: string
  lastName: string
  currentPassword?: string
  password?: string
  confirmPassword?: string
}

const PreferencesPage = () => {
  const { user, setRefreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [updatePassword, setUpdatePassword] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null)
  
  const [formData, setFormData] = useState<ProfileUpdateData>({
    firstName: '',
    middleName: '',
    lastName: '',
    currentPassword: '',
    password: '',
    confirmPassword: ''
  })
  
  const [errors, setErrors] = useState<Partial<ProfileUpdateData>>({})

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        middleName: user.middle_name || '',
        lastName: user.last_name || '',
        currentPassword: '',
        password: '',
        confirmPassword: ''
      })
    }
  }, [user])

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileUpdateData> = {}

    // First name and last name are required
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    // Password validation only if user wants to update password
    if (updatePassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required'
      }
      if (!formData.password) {
        newErrors.password = 'Please enter your new password'
      } 
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your new password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof ProfileUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    if (!value) {
      setErrors(prev => ({ ...prev, [field]: `This field is required` }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!user) {
      setAlertMessage({
        type: 'destructive',
        message: 'User not found. Please refresh the page.'
      })
      return
    }

    try {
      setIsLoading(true)
      setAlertMessage(null)

      const updateData = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        currentPassword: updatePassword ? formData.currentPassword : null,
        password: updatePassword ? formData.password : null
      }

      const response = await fetch('/api/users', {
        method: 'PUT',
        body: JSON.stringify({
          profile: updateData
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setAlertMessage({
          type: 'destructive',
          message: result.error || 'Failed to update user profile'
        });
        return;
      }
      setRefreshUser(true);

      setAlertMessage({
        type: 'success',
        message: 'User profile updated successfully!'
      })

      // Reset password fields if password was updated
      if (updatePassword) {
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          password: '',
          confirmPassword: ''
        }))
        setUpdatePassword(false)
      }

    } catch (error) {
      console.error('Error updating user profile:', error)
      setAlertMessage({
        type: 'destructive',
        message: error instanceof Error ? error.message : 'Failed to update user profile'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alert Message */}
            {alertMessage && (
              <Alert
                autoClose={true}
                variant={alertMessage.type}
                message={alertMessage.message}
                onClose={() => setAlertMessage(null)}
              />
            )}

            {/* Name Fields */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Input
                  id="firstName"
                  label="First Name *"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  id="middleName"
                  label="Middle Name"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  placeholder="Enter middle name"
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="lastName"
                  label="Last Name *"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Password Update Toggle */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Switch
                id="update-password"
                checked={updatePassword}
                onCheckedChange={setUpdatePassword}
              />
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <label htmlFor="update-password" className="text-sm font-medium">
                  Update password
                </label>
              </div>
            </div>

            {/* Password Fields - Only show when toggle is enabled */}
            {updatePassword && (
              <div className="grid gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <Input
                    id="currentPassword"
                    label="Current Password *"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    placeholder="Enter your current password"
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-red-500">{errors.currentPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    id="password"
                    label="New Password *"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter new password"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    id="confirmPassword"
                    label="Confirm New Password *"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
                
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
              variant="primary"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default PreferencesPage