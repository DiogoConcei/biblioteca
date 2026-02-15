import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Loading from '../Loading/Loading';
import useUIStore from '../../store/useUIStore';

export default function SystemConfig() {
  const isLoading = useUIStore((s) => s.loading);

  const reOrderId = async () => {
    await window.electronAPI.system.reorderId();
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <Typography variant="h5" sx={{ mb: 3, color: '#fff' }}>
        Ajustes Rápidos
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: '#ccc' }}>
        Esta área permite realizar pequenos ajustes no sistema...
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxWidth: 500,
        }}
      >
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#2a3439',
            '&:hover': { backgroundColor: '#7f4fb3' },
          }}
          onClick={reOrderId}
        >
          Reordenar IDs (temporário)
        </Button>

        <Button
          variant="contained"
          sx={{
            backgroundColor: '#2a3439',
            '&:hover': { backgroundColor: '#7f4fb3' },
          }}
        >
          Reordenar séries (permanente)
        </Button>

        <Button
          variant="contained"
          sx={{
            backgroundColor: '#2a3439',
            '&:hover': { backgroundColor: '#7f4fb3' },
          }}
        >
          Ativar auto backup
        </Button>
      </Box>
    </>
  );
}
