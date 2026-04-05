import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';

interface Pilgrim {
  id?: number;
  fullName: string;
  age: number;
  gender: string;
  aadharNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  mobileNumber: string;
}

interface DarshanBooking {
  id?: number;
  userId: number;
  bookingDate: string;
  pilgrims: Pilgrim[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: number;
}

interface DailyQuota {
  date: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
}

const DarshanPage: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<number>(1);
  const [dailyQuota, setDailyQuota] = useState<DailyQuota | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [numberOfPilgrims, setNumberOfPilgrims] = useState<number>(1);
  const [bookings, setBookings] = useState<DarshanBooking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const { register, control, handleSubmit, formState: { errors }, reset, watch } = useForm<DarshanBooking>({
    defaultValues: {
      bookingDate: new Date().toISOString().split('T')[0],
      pilgrims: [{ fullName: '', age: 0, gender: 'male', aadharNumber: '', address: '', city: '', state: '', country: 'India', pincode: '', mobileNumber: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pilgrims"
  });

  // Fetch daily quota
  useEffect(() => {
    fetchDailyQuota(selectedDate);
    checkUserRole();
  }, [selectedDate]);

  // Fetch bookings if admin
  useEffect(() => {
    if (isAdmin) {
      fetchBookings();
    }
  }, [isAdmin, filterStatus]);

  const fetchDailyQuota = async (date: string) => {
    try {
      const response = await fetch(`/api/darshan/quota?date=${date}`);
      const data = await response.json();
      setDailyQuota(data);
    } catch (error) {
      toast.error('Failed to fetch daily quota');
    }
  };

  const checkUserRole = async () => {
    try {
      const response = await fetch('/api/user/role');
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const url = filterStatus === 'all' 
        ? '/api/darshan/bookings' 
        : `/api/darshan/bookings?status=${filterStatus}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    }
  };

  const handlePilgrimCountChange = (count: number) => {
    setNumberOfPilgrims(count);
    
    // Adjust the form array based on the count
    if (count > fields.length) {
      for (let i = fields.length; i < count; i++) {
        append({ fullName: '', age: 0, gender: 'male', aadharNumber: '', address: '', city: '', state: '', country: 'India', pincode: '', mobileNumber: '' });
      }
    } else if (count < fields.length) {
      for (let i = fields.length; i > count; i--) {
        remove(i - 1);
      }
    }
  };

  const onSubmit = async (data: DarshanBooking) => {
    try {
      const response = await fetch('/api/darshan/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Booking submitted successfully!');
        setCurrentScreen(4); // Show summary screen
        fetchDailyQuota(selectedDate); // Refresh quota
      } else {
        toast.error('Failed to submit booking');
      }
    } catch (error) {
      toast.error('An error occurred while submitting the booking');
    }
  };

  const handleApproveBooking = async (bookingId: number) => {
    try {
      const response = await fetch(`/api/darshan/approve/${bookingId}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Booking approved successfully!');
        fetchBookings(); // Refresh bookings list
      } else {
        toast.error('Failed to approve booking');
      }
    } catch (error) {
      toast.error('An error occurred while approving the booking');
    }
  };

  const handleRejectBooking = async (bookingId: number) => {
    try {
      const response = await fetch(`/api/darshan/reject/${bookingId}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Booking rejected successfully!');
        fetchBookings(); // Refresh bookings list
      } else {
        toast.error('Failed to reject booking');
      }
    } catch (error) {
      toast.error('An error occurred while rejecting the booking');
    }
  };

  // Screen 1: Daily Quota Bar
  const renderQuotaScreen = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Darshan Booking</h2>
      <p className="mb-6 text-gray-600">Check available slots for your preferred date</p>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      
      {dailyQuota && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Available Slots</span>
            <span className="text-sm font-medium">{dailyQuota.availableSlots} / {dailyQuota.totalSlots}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: `${(dailyQuota.availableSlots / dailyQuota.totalSlots) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setCurrentScreen(2)}
        disabled={!dailyQuota || dailyQuota.availableSlots === 0}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {!dailyQuota ? 'Loading...' : dailyQuota.availableSlots === 0 ? 'No Slots Available' : 'Proceed to Booking'}
      </button>
    </div>
  );

  // Screen 2: Pilgrim Count Selector
  const renderPilgrimCountScreen = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Number of Pilgrims</h2>
      <p className="mb-6 text-gray-600">How many people will be attending the darshan?</p>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Pilgrims (Max: 5)</label>
        <select
          value={numberOfPilgrims}
          onChange={(e) => handlePilgrimCountChange(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {[1, 2, 3, 4, 5].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Maximum 5 pilgrims allowed per booking</p>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentScreen(1)}
          className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentScreen(3)}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );

  // Screen 3: Dynamic Pilgrim Forms
  const renderPilgrimFormsScreen = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Pilgrim Details</h2>
      <p className="mb-6 text-gray-600">Please provide details for each pilgrim</p>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("bookingDate")} value={selectedDate} />
        
        {fields.map((field, index) => (
          <div key={field.id} className="mb-6 p-4 border border-gray-200 rounded-md">
            <h3 className="text-lg font-medium mb-4">Pilgrim {index + 1}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  {...register(`pilgrims.${index}.fullName` as const, { required: "Full name is required" })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.pilgrims?.[index]?.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.pilgrims[index]?.fullName?.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  {...register(`pilgrims.${index}.age` as const, { 
                    required: "Age is required",
                    min: { value: 1, message: "Age must be at least 1" },
                    max: { value: 120, message: "Age must be less than 120" }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.pilgrims?.[index]?.age && (
                  <p className="text-red-500 text-xs mt-1">{errors.pilgrims[index]?.age?.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  {...register(`pilgrims.${index}.gender` as const)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                <input
                  {...register(`pilgrims.${index}.aadharNumber` as const, { 
                    required: "Aadhar number is required",
                    pattern: {
                      value: /^[0-9]{12}$/,
                      message: "Aadhar number must be 12 digits"
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.pilgrims?.[index]?.aadharNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.pilgrims[index]?.aadharNumber?.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  {...register(`pilgrims.${index}.address` as const, { required: "Address is required" })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={2}
                />
                {errors.pilgrims?.[index]?.address && (
                  <p className="text-red-500 text-xs mt-1">{errors.pilgrims[index]?.address?.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  {...register(`pilgrims.${index}.city` as const, { required: "City is required" })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.pilgrims?.[index]?.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.pilgrims[index]?.city?.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  {...register(`pilgrims.${index}.state` as const, { required: "State is required" })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.pilgrims?.[index]?.state && (
                  <p className="text-red-500 text-xs mt-1">{errors.pilgrims[index]?.state?.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  {...register(`pilgrims.${index}.pincode` as const, { 
                    required: "Pincode is required",
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: "Pincode must be 6 digits"
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.pilgrims?.[index]?.pincode && (
                  <p className="text-red-500 text-xs mt-1">{errors.pilgrims[index]?.pincode?.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  {...register(`pilgrims.${index}.mobileNumber` as const, { 
                    required: "Mobile number is required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Mobile number must be 10 digits"
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.pilgrims?.[index]?.mobileNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.pilgrims[index]?.mobileNumber?.message}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => setCurrentScreen(2)}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Back
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Submit Booking
          </button>
        </div>
      </form>
    </div>
  );

  // Screen 4: Booking Summary
  const renderBookingSummaryScreen = () => {
    const formData = watch();
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Booking Confirmation</h2>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          Your booking has been submitted successfully and is pending approval.
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Booking Details</h3>
          <p><strong>Date:</strong> {selectedDate}</p>
          <p><strong>Number of Pilgrims:</strong> {numberOfPilgrims}</p>
          <p><strong>Status:</strong> Pending Approval</p>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Pilgrim Details</h3>
          {formData.pilgrims.map((pilgrim, index) => (
            <div key={index} className="mb-4 p-3 border border-gray-200 rounded-md">
              <h4 className="font-medium">Pilgrim {index + 1}: {pilgrim.fullName}</h4>
              <p>Age: {pilgrim.age} | Gender: {pilgrim.gender}</p>
              <p>Aadhar: {pilgrim.aadharNumber}</p>
              <p>Mobile: {pilgrim.mobileNumber}</p>
            </div>
          ))}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
          <p>You will receive an SMS once your booking is approved. Please bring your Aadhar card for verification at the temple.</p>
        </div>
        
        <button
          onClick={() => {
            setCurrentScreen(1);
            reset();
            setNumberOfPilgrims(1);
          }}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Book Another Darshan
        </button>
      </div>
    );
  };

  // Screen 5: Bookings List with Filters (Admin)
  const renderBookingsListScreen = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Darshan Bookings Management</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pilgrims</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map(booking => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap">#{booking.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{booking.pilgrims.length} pilgrims</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                    booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveBooking(booking.id!)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button className="text-blue-600 hover:text-blue-900 ml-3">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {bookings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No bookings found with the selected filter.
          </div>
        )}
      </div>
    </div>
  );

  // Main render function
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {!isAdmin && currentScreen <= 4 && (
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {[1, 2, 3, 4].map(step => (
                <div
                  key={step}
                  className={`px-4 py-2 rounded-md ${currentScreen === step ? 'bg-white shadow' : 'text-gray-500'}`}
                >
                  Step {step}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!isAdmin ? (
          <>
            {currentScreen === 1 && renderQuotaScreen()}
            {currentScreen === 2 && renderPilgrimCountScreen()}
            {currentScreen === 3 && renderPilgrimFormsScreen()}
            {currentScreen === 4 && renderBookingSummaryScreen()}
          </>
        ) : (
          renderBookingsListScreen()
        )}
      </div>
    </div>
  );
};

export default DarshanPage;
