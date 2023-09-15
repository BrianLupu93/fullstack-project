import { useForm } from 'react-hook-form';
import Input from '../Utils/Input';
import Button from '../Utils/Button';
import Select from '../Utils/Select';
import Modal from '../Utils/modal/Modal';
import { toast } from 'react-hot-toast';
import { timeRanges } from '../../data/dataVariables';
import CalendarMini from '../booking/CalendarMini';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeModal,
  openModal,
} from './../../features/modal/confirmModalSlice';
import {
  resetBookingDays,
  resetTime,
  setTime,
} from './../../features/booking/bookingSlice';
import {
  addIncomes,
  fetchClients,
  resetSelectedClient,
  setSelectedClient,
} from '../../features/clients/clientsSlice';
import dayjs from 'dayjs';
import { useState } from 'react';
import { createSubscription } from '../../features/clients/clientsSlice';
import calculateEndSubscription from '../../features/utils/calculateEndSubscription';

const SubscriptionForm = () => {
  const dispatch = useDispatch();
  const confirmModal = useSelector((state) => state.modal);
  const booking = useSelector((state) => state.booking);
  const selectedClient = useSelector((state) => state.clients.selectedClient);
  const trainingOptions = useSelector((state) => state.booking.trainigOptions);
  const clients = useSelector((state) => state.clients.clients);
  const prices = useSelector((state) => state.booking.prices);
  const error = useSelector((state) => state.clients.error);
  const modalFrom = useSelector((state) => state.modal.from);

  const [daysChoice, setDaysChoice] = useState(null);
  const [scheduleTrainings, setScheduleTrainings] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      client: '',
      price: 0,
      startDate: '',
      time: '',
      trainingNumbers: '',
    },
  });

  const onSubmit = async (data) => {
    delete data['time'];

    const trainingScheduled = booking.bookingDays.length;
    const remainToSchedule = data.trainingNumbers - booking.bookingDays.length;
    const startDate = dayjs(data.startDate).format('DD/MM/YYYY');

    const endDate = calculateEndSubscription(
      data.startDate,
      data.trainingNumbers
    );
    const subscription = {
      trainingsTotal: data.trainingNumbers,
      trainingsDone: 0,
      trainingsRemain: data.trainingNumbers,
      trainingsReBooked: 0,
      trainingsScheduled: trainingScheduled,
      trainingsToSchedule: remainToSchedule,
      startDate: startDate,
      endDate: endDate,
      isActive: true,
      price: data.price,
      trainingDays: booking.bookingDays,
    };

    const reqData = {
      name: selectedClient.name,
      eamil: selectedClient.email,
      phone: selectedClient.phone,
      subscription: [subscription],
    };

    await dispatch(
      createSubscription({ id: selectedClient._id, data: reqData })
    );
    if (error !== '') {
      toast.success('Eroare! Te rog sa incerci din nou');
    } else {
      toast.success('Abonament atribuit');
    }
    await dispatch(addIncomes({ id: selectedClient._id, data: reqData }));
    await dispatch(resetBookingDays());
    await dispatch(resetTime());
    await dispatch(resetSelectedClient());
    await dispatch(fetchClients());
    await dispatch(closeModal());
    reset();
    setScheduleTrainings(false);
  };

  const openSubmitModal = (data) => {
    dispatch(setSelectedClient(data.client));
    dispatch(
      openModal({
        from: 'addSubscription',
        title: 'Atribuie abonament',
        message:
          'Datele introduse sunt corecte? Doresti sa confirmi atribuirea abonamentului',
      })
    );
  };

  return (
    <>
      <div className='flex flex-col md:px-10 px-0 w-full'>
        <div className='flex flex-col w-full items-center mb-8'>
          <div className='text-3xl mb-10'>Atribuie Abonament</div>
          <div className='text-xl mb-4 w-full'>Detalii Abonament</div>
          <form>
            <div className='flex md:flex-row flex-col text-md gap-2 self-center w-full'>
              <Select
                id='client'
                register={register}
                errors={errors}
                required
                label='Client'
                extraClass='py-2 mb-1'
                options={clients.map((client) => {
                  return { id: client._id, value: client.name };
                })}
              />
              <Select
                id='trainingNumbers'
                register={register}
                errors={errors}
                required
                label='Numar Sedinte'
                extraClass='py-2 mb-1'
                options={trainingOptions}
                onChangeCapture={(e) => setDaysChoice(e.target.value)}
              />
              <Input
                type='date'
                id='startDate'
                label='Data de Start'
                extraClass='py-1 mb-1'
                register={register}
                errors={errors}
                required
              />
              <Select
                id='price'
                label='Pret'
                options={prices}
                extraClass='py-2 mb-1'
                register={register}
                errors={errors}
                required
              />
            </div>
            <div className='mt-4 w-full flex md:flex-row flex-col md:justify-between items-center'>
              <Button
                label={scheduleTrainings ? 'Doar Abonament' : 'Antrenamente'}
                extraClass='md:w-3/12 w-full h-10'
                small
                onClick={(e) => {
                  e.preventDefault();
                  setScheduleTrainings(!scheduleTrainings);
                }}
              />
              {scheduleTrainings && (
                <div className=' md:w-3/12 w-full md:mt-0 mt-4'>
                  <Select
                    id='time'
                    label='Interval Orar'
                    options={timeRanges}
                    extraClass='py-2 mb-4 flex'
                    register={register}
                    errors={errors}
                    onChangeCapture={(e) => {
                      dispatch(setTime(e.target.value));
                    }}
                  />
                </div>
              )}
            </div>
          </form>
          {scheduleTrainings && (
            <div className='flex flex-col text-md gap-2 self-center w-full mb-4'>
              <CalendarMini />
            </div>
          )}

          {modalFrom !== 'updateSubscription' && (
            <div className='flex md:flex-row flex-col mt-2 gap-2 justify-center w-full'>
              <div className='w-full text-center text-red-500'>
                Sedinte Programate:
                <span className='font-bold pl-2'>
                  {booking.bookingDays.length}
                </span>
              </div>
              <div className='w-full text-center text-blue-600'>
                Sedinte Restante:
                <span className='font-bold pl-2'>
                  {daysChoice - booking.bookingDays.length}
                </span>
              </div>
            </div>
          )}

          <div className='w-full mt-4 md:px-0 px-4 text-center'>
            <Button
              label='Atribuie Abonament'
              extraClass='md:w-3/12 w-full'
              small
              onClick={handleSubmit(openSubmitModal)}
            />
          </div>
        </div>
      </div>
      {confirmModal.from === 'addSubscription' && (
        <Modal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          secondaryAction={() => dispatch(closeModal())}
          secondaryActionLabel='Inapoi'
          onSubmit={handleSubmit(onSubmit)}
          actionLabel='Confirma'
          onClose={() => dispatch(closeModal())}
          body={confirmModal.message}
          small
        />
      )}
    </>
  );
};

export default SubscriptionForm;