import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Edit2, Trash2, Plus, RefreshCw, User, Calendar } from 'lucide-react';

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Stylist {
  id: string;
  name: string;
  photoUrl: string | null;
  isActive: boolean;
  schedules: Schedule[];
}

export const StaffPage: React.FC = () => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);

  // Formulario Stylist
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Horarios de Trabajo (días seleccionados)
  const [workDays, setWorkDays] = useState<boolean[]>([
    false, // 0 = Domingo
    true,  // 1 = Lunes
    true,  // 2 = Martes
    true,  // 3 = Miércoles
    true,  // 4 = Jueves
    true,  // 5 = Viernes
    true,  // 6 = Sábado
  ]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:00');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPhotoUrl(res.data.url);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al subir la imagen a Cloudinary');
    } finally {
      setUploading(false);
    }
  };

  const fetchStylists = async () => {
    setLoading(true);
    try {
      const res = await api.get('/client/stylists?all=true');
      setStylists(res.data);
    } catch (err) {
      console.error('Error al obtener estilistas de administración:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStylists();
  }, [refreshTrigger]);

  const handleOpenAdd = () => {
    setEditingStylist(null);
    setName('');
    setPhotoUrl('');
    setIsActive(true);
    setWorkDays([false, true, true, true, true, true, true]); // Lunes a Sábado
    setStartTime('09:00');
    setEndTime('19:00');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Stylist) => {
    setEditingStylist(s);
    setName(s.name);
    setPhotoUrl(s.photoUrl || '');
    setIsActive(s.isActive);

    // Mapear horarios existentes a los checkboxes
    const days = [false, false, false, false, false, false, false];
    let startVal = '09:00';
    let endVal = '19:00';

    if (s.schedules && s.schedules.length > 0) {
      s.schedules.forEach((sch) => {
        days[sch.dayOfWeek] = true;
      });
      startVal = s.schedules[0].startTime;
      endVal = s.schedules[0].endTime;
    }

    setWorkDays(days);
    setStartTime(startVal);
    setEndTime(endVal);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Armar el payload de schedules basados en workDays checkboxes
    const schedulesPayload: any[] = [];
    workDays.forEach((isChecked, dayIndex) => {
      if (isChecked) {
        schedulesPayload.push({
          dayOfWeek: dayIndex,
          startTime,
          endTime,
        });
      }
    });

    const data = {
      name,
      photoUrl: photoUrl || null,
      isActive,
      schedules: schedulesPayload,
    };

    try {
      if (editingStylist) {
        await api.put(`/admin/stylists/${editingStylist.id}`, data);
        alert('Barbero actualizado con éxito');
      } else {
        await api.post('/admin/stylists', data);
        alert('Barbero creado con éxito');
      }
      setIsModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar barbero');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar/desactivar este estilista?')) return;
    try {
      await api.delete(`/admin/stylists/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar estilista');
    }
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <User className="text-zinc-400" /> Barberos & Personal
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Configura el personal de la barbería y administra sus horarios.</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={fetchStylists} variant="outline" size="sm">
            <RefreshCw size={14} />
          </Button>
          <Button onClick={handleOpenAdd} variant="primary" size="sm" className="flex items-center gap-1">
            <Plus size={14} /> Nuevo Barbero
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm uppercase tracking-widest text-zinc-500">Cargando personal...</div>
      ) : stylists.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">No hay estilistas registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stylists.map((st) => (
            <Card
              key={st.id}
              className={`border relative flex flex-col justify-between items-center text-center p-6 ${
                st.isActive ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-900 bg-black opacity-60'
              }`}
            >
              {/* Photo */}
              <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden mb-4 rounded-none">
                {st.photoUrl ? (
                  <img src={st.photoUrl} alt={st.name} className="w-full h-full object-cover filter grayscale" />
                ) : (
                  <User size={32} className="text-zinc-700" />
                )}
              </div>

              <div>
                <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center justify-center gap-1.5">
                  {st.name}
                  {!st.isActive && (
                    <span className="text-[8px] bg-zinc-900 text-zinc-500 border border-zinc-800 px-1 font-bold">Inactivo</span>
                  )}
                </h3>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mt-1">Barbero Oficial</span>
              </div>

              {/* Schedules info */}
              <div className="w-full border-t border-zinc-900 pt-4 mt-4 space-y-2 text-left">
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block flex items-center gap-1">
                  <Calendar size={12} /> Días de Atención:
                </span>
                <div className="flex gap-1 flex-wrap">
                  {st.schedules && st.schedules.length > 0 ? (
                    st.schedules.map((sch) => (
                      <span
                        key={sch.id}
                        className="bg-zinc-900 border border-zinc-800 text-[8px] font-bold font-mono px-1 py-0.5 text-zinc-300"
                        title={`Horario: ${sch.startTime} - ${sch.endTime}`}
                      >
                        {dayNames[sch.dayOfWeek]}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] text-zinc-600">Sin horarios asignados</span>
                  )}
                </div>
              </div>

              {/* Actions footer */}
              <div className="w-full border-t border-zinc-900 pt-3 mt-4 flex justify-between items-center">
                <span className="text-[9px] font-mono text-zinc-600 uppercase">
                  {st.schedules?.[0]?.startTime ? `${st.schedules[0].startTime} - ${st.schedules[0].endTime}` : 'No hrs'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenEdit(st)} className="text-zinc-400 hover:text-white p-1" title="Editar">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(st.id)} className="text-zinc-400 hover:text-red-400 p-1" title="Eliminar">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Crear/Editar Estilista */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStylist ? 'Editar Estilista' : 'Crear Nuevo Estilista'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Nombre del Barbero</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 rounded-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Fotografía del Barbero</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full text-xs text-zinc-400 file:mr-4 file:py-1 file:px-3 file:border file:border-zinc-800 file:bg-zinc-950 file:text-zinc-300 file:cursor-pointer hover:file:border-zinc-600 disabled:opacity-50"
                />
                {uploading && <div className="text-[10px] uppercase tracking-wider text-zinc-500 animate-pulse">Subiendo a Cloudinary...</div>}
                <input
                  type="text"
                  value={photoUrl}
                  placeholder="https://ejemplo.com/barbero.jpg"
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Selector de Horarios */}
          <div className="border-t border-zinc-900 pt-4 space-y-3">
            <span className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Configuración de Horarios</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Hora de Entrada</label>
                <input
                  type="text"
                  placeholder="Ej: 09:00"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 rounded-none text-center"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Hora de Salida</label>
                <input
                  type="text"
                  placeholder="Ej: 19:00"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 rounded-none text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-zinc-500 mb-2">Días Laborales</label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {workDays.map((isChecked, index) => (
                  <div key={index} className="flex flex-col items-center p-2 bg-zinc-900 border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1">{dayNames[index]}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const newDays = [...workDays];
                        newDays[index] = e.target.checked;
                        setWorkDays(newDays);
                      }}
                      className="accent-white h-4 w-4"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2 border-t border-zinc-900 pt-4">
            <input
              type="checkbox"
              id="isActiveStylistCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-white h-4 w-4"
            />
            <label htmlFor="isActiveStylistCheck" className="text-xs uppercase tracking-widest text-zinc-300 cursor-pointer font-medium">
              Personal Activo (Visible en reservas)
            </label>
          </div>

          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Guardando...' : editingStylist ? 'Actualizar Barbero' : 'Crear Barbero'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
