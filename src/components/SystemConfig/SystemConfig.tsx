import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Loading from '../Loading/Loading';
import useUIStore from '../../store/useUIStore';
import { Dispatch } from 'react';

export default function SystemConfig({
  setIsOpen,
}: {
  setIsOpen: Dispatch<React.SetStateAction<boolean>>;
}) {
  const isLoading = useUIStore((s) => s.loading);

  const reOrderId = async () => {
    await window.electronAPI.system.reorderId();
  };

  if (isLoading) return <Loading />;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000cc',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={() => setIsOpen(false)} // fecha clicando fora
    >
      <Box
        onClick={(e) => e.stopPropagation()} // impede fechar ao clicar dentro
        sx={{
          bgcolor: '#282c34',
          p: 4,
          borderRadius: 2,
          boxShadow: 24,
          width: 1000,
          height: 600,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="body1" sx={{ mb: 3, color: '#fcf7f8' }}>
          Esta área permite realizar pequenos ajustes no sistema. Você pode
          corrigir o índice de IDs, regenerar capas que não foram criadas
          corretamente ou reorganizar capítulos quando a ordem não estiver como
          esperado. Também é possível ativar ou desativar o modo de tela cheia e
          trocar o tema da aplicação.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
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
      </Box>
    </Box>
  );
}
