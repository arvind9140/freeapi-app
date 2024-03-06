import { Card } from '@/components/ui'
import React from 'react'
import { FaFolder } from 'react-icons/fa'

const index = () => {
  return (
    <div className='grid grid-cols-3 gap-4'>
     <Card>
      <div className='flex justify-between text-lg'>
      <div className={` text-xl mr-3 text-yellow-500`}>
                                  <FaFolder />
                              </div>
     <p> Design</p>
      </div></Card>
  
    <Card>
      <div className='flex justify-between text-lg'>
      <div className={` text-xl mr-3 text-yellow-500`}>
                                  <FaFolder />
                              </div>
     <p> Design and Execution</p>
      </div></Card>
    
    </div>
  )
}

export default index