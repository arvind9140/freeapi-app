import { useMemo, Fragment, useState, useEffect, useContext } from 'react'
import Table from '@/components/ui/Table'
import {
    useReactTable,
    getCoreRowModel,
    getExpandedRowModel,
    flexRender,
} from '@tanstack/react-table'
import { HiOutlineChevronRight, HiOutlineChevronDown } from 'react-icons/hi'
import type { ApiResponse, MomData } from './data'
import type { ColumnDef, Row, ColumnSort } from '@tanstack/react-table'
import type { ReactElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Dropdown, Notification, toast } from '@/components/ui'
import { apiGetCrmProjectsMom } from '@/services/CrmService'
import { useMomContext } from '../../store/MomContext'
import appConfig from '@/configs/app.config'
import { BsThreeDotsVertical } from 'react-icons/bs'

type ReactTableProps<T> = {
    renderRowSubComponent: (props: { row: Row<T> }) => ReactElement
    getRowCanExpand: (row: Row<T>) => boolean
    data: Data
}
type Data = {
    client_name:string,
    mom: MOM[]
}
type MOM = {
    mom_id: string
}

const { Tr, Th, Td, THead, TBody } = Table

function ReactTable({
    renderRowSubComponent,
    getRowCanExpand,
    
}: ReactTableProps<MomData>) {
    const columns = useMemo<ColumnDef<MomData>[]>(
        () => [
            {
                header: () => null, 
                id: 'expander', 
                cell: ({ row }) => (
                    <>
                        {row.getCanExpand() ? (
                            <button
                                className="text-lg"
                                {...{ onClick: row.getToggleExpandedHandler() }}
                            >
                                {row.getIsExpanded() ? (
                                    <HiOutlineChevronDown />
                                ) : (
                                    <HiOutlineChevronRight />
                                )}
                            </button>
                        ) : null}
                    </>
                ),
                subCell: () => null, 
            },
            {
                header: 'MOM Id',
                accessorKey: 'mom_id',
            },
            // Update the 'Client Name' column definition
            {
                header: 'Client Name',
                accessorKey: 'attendees',
                cell: (props) => {
                    const row = props.row.original
                    const clientNames = Array.isArray(
                        row.attendees?.client_name,
                    )
                        ? row.attendees.client_name
                        : [row.attendees.client_name]

                    return <span>{clientNames.join(', ')}</span>
                },
            },
            {
                header: 'Meeting Date',
                accessorKey: 'meetingdate',
                cell: (props) => {
                    const row = props.row.original
                    const date = new Date(row.meetingdate)
                    const day = String(date.getUTCDate()).padStart(2, '0')
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0') // Months are 0-based in JavaScript
                    const year = date.getUTCFullYear()
                
                    const formattedDate= `${day}-${month}-${year}`

                    return <div>{formattedDate}</div>
                },
            },
            {
                header: 'Location',
                accessorKey: 'location',
            },
        ],
        [],
    )

    const location = useLocation()
    const { leadData, client } = useMomContext();
    const projectId = new URLSearchParams(location.search).get('project_id')
    const [sorting, setSorting] = useState<ColumnSort[]>([])
    const table = useReactTable({
        data: leadData || [],
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getRowCanExpand,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    })

    const navigate = useNavigate()

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button
                    className="flex justify-center items-center"
                    size="sm"
                    variant="solid"
                    onClick={() =>
                        navigate(
                            `/app/crm/project/momform?project_id=${projectId}&client_name=${client?.client_name}`
                        )
                    }
                >
                    Add MOM{' '}
                </Button>
            </div>
            {table.getRowModel().rows.length > 0 ? (
                <>
    <Table>
        <THead>
            {table.getHeaderGroups().map((headerGroup) => (
                <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                        <Th key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder ? null : (
                                <div
                                    {...{
                                        className: header.column.getCanSort()
                                            ? 'cursor-pointer select-none'
                                            : '',
                                        onClick: header.column.getToggleSortingHandler(),
                                    }}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </div>
                            )}
                        </Th>
                    ))}
                </Tr>
            ))}
        </THead>
        <TBody>
            {table.getRowModel().rows.slice(0, 10).map((row) => (
                <Fragment key={row.id}>
                    <Tr>
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </Tr>
                    {row.getIsExpanded() && (
                        <Tr>
                            <Td colSpan={row.getVisibleCells().length}>
                                {renderRowSubComponent({ row })}
                            </Td>
                        </Tr>
                    )}
                </Fragment>
            ))}
        </TBody>
    </Table>
      
</>
) : (
    <div style={{ textAlign: 'center' }}>No Mom Data</div>
)}
        </>
    )
}

const renderSubComponent = ({ row }: { row: Row<MomData> }) => {
    const location=useLocation()
    const projectId = new URLSearchParams(location.search).get('project_id')

    const rowData = row.original
    const files = Array.isArray(rowData.files) ? rowData.files : []
    const handleShareMOM = async () => {
        try {
            const project_id:any = projectId;
            const momId = rowData.mom_id;
            
            const response = await fetch(
              `http://localhost:8000/v1/api/admin/send/momdata`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('auth')}`,
                },
                body: JSON.stringify({
                  project_id: projectId,
                  mom_id: momId,
                }),
              }
            );
            const responseData=await response.json()
            console.log(responseData);
            
            if (response.ok) {
                toast.push(
                    <Notification closable type="success" duration={2000}>
                        "MOM shared successfully"
                    </Notification>
                )
            } else {
                toast.push(
                    <Notification closable type="danger" duration={2000}>
                        {responseData.errorMessage}
                    </Notification>
                )
            }
        } catch (error) {
            console.error('Error sharing MOM:', error)
            alert(
                'An error occurred while sharing MOM. Please try again later.',
            )
        }
    }
    const { apiPrefix } = appConfig
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const day = String(date.getUTCDate()).padStart(2, '0')
        const month = String(date.getUTCMonth() + 1).padStart(2, '0') // Months are 0-based in JavaScript
        const year = date.getUTCFullYear()
    
        return `${day}-${month}-${year}`
    }
    const Toggle=<BsThreeDotsVertical className='font-semibold text-xl cursor-pointer'/>
    
    return (
        <div>
             <main className="pb-10 ">
        <div className=" dark:bg-gray-950 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex justify-between mb-8">
              <h2 className="text-2xl font-bold">Meeting Details</h2>
              <span>
              <Dropdown renderTitle={Toggle} placement='bottom-end'>
              <a href={`http://localhost:8000/v1/api/admin/generate/pdf?project_id=${projectId}&mom_id=${rowData.mom_id}`} target='_blank' rel='noreferrer'    
                    >  
                <Dropdown.Item eventKey="a" >View MOM</Dropdown.Item></a>
                <Dropdown.Item eventKey="b" onClick={()=>handleShareMOM()}>Share MOM</Dropdown.Item>
               
            </Dropdown></span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className='flex gap-1 items-center'>
                <p className="text-gray-500 dark:text-gray-400 font-semibold text-lg">Location: </p>
                <p className=' text-base'>{rowData.location}</p>
                </div>
                <div className='flex gap-1 items-center'>
                <p className="text-gray-500 dark:text-gray-400 font-semibold text-lg">Date: </p>
                <p className=' text-base'>{formatDate(rowData.meetingdate)}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 font-semibold text-xl">Attendees</p>
                <ul className="space-y-1">
                  <li className=' text-base'><span className='font-semibold text-lg'>Client:</span> {rowData.attendees.client_name?rowData.attendees.client_name:"-"} </li>
                  <li className=' text-base'><span className='font-semibold text-lg'>Organizer:</span> {rowData.attendees.organisor?rowData.attendees.organisor:"-"} </li>
                  <li className=' text-base'><span className='font-semibold text-lg'>Designer:</span> {rowData.attendees.designer?rowData.attendees.designer:"-"} </li>
                  <li className=' text-base'><span className='font-semibold text-lg'>Others:</span> {rowData.attendees.attendees?rowData.attendees.attendees:"-"} </li>
                </ul>
              </div>
            </div>
            <div className='mb-6'>
              <p className="text-gray-500 dark:text-gray-400 font-semibold text-xl ">Remarks</p>
              <p>
                {rowData.remark?rowData.remark:"-"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-semibold text-xl">Files</p>
              <div className="space-y-2">
              {files.length > 0 ? (
                files.map((file) => (
                    <a className="flex items-center gap-2 text-blue-600 hover:underline" href={file.fileUrl} target='_blank'>
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
                        className="h-5 w-5"
                    >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    {file.fileName.length > 20 ? `${file.fileName.substring(0, 20)}...` : file.fileName}
                    </a>
                ))
                ) : (
                <p>No files</p>
                )}
             
              </div>
            </div>
          </div>
        </div>
      </main>
    
        </div>
    )
}

const SubComponent = ({ data }: ApiResponse) => {
    return (
        <ReactTable
            renderRowSubComponent={renderSubComponent}
            getRowCanExpand={() => true}
            data={data}
        />
    )
}

export default SubComponent
