import useUIStore from '../../store/useUIStore';

export default function SystemConfig() {
  const isLoading = useUIStore((s) => s.loading);

  // const reOrderId = async () => {
  //   await window.electronAPI.system.reorderId();
  // };

  return <p>A</p>;
}
