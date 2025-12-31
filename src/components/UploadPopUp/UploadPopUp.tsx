import useUIStore from '../../store/useUIStore';
import useSerieStore from '../../store/useSerieStore';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { Dispatch } from 'react';

export default function uploadPopUp({
  isOpen,
  setIsOpen,
  literatureForm,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<React.SetStateAction<boolean>>;
  literatureForm: string;
}) {
  const setChapters = useSerieStore((s) => s.setChapters);
  const setError = useUIStore((s) => s.setError);
  const dataPath = useSerieStore((s) => s.serie?.dataPath || '');

  const localUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();

    const items = e.target.files;

    if (!items) {
      setError('Nenhum arquivo selecionado para upload.');
      return;
    }

    const filesPath = Array.from(items).map((file) => file.path);

    const response = await window.electronAPI.upload.uploadChapter(
      filesPath,
      literatureForm,
      dataPath,
    );

    if (!response.data || !response.success) {
      setError(`Erro desconhecido ao fazer upload de capítulos.`);
      return;
    }

    const chapters = response.data.sort((a, b) => a.id - b.id);

    setChapters(chapters);
  };

  return (
    <div>
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        {/* É possível fazer styled components */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',

              bgcolor: '#aa5042',
              p: 4,
              borderRadius: 2,
              boxShadow: 24,

              width: 600,
            }}
          >
            <Typography variant="body1" sx={{ mb: 3, color: '#fcf7f8' }}>
              Adicione mais capítulos à sua série! Para isso, temos duas opções:
              fazer o upload diretamente do seu dispositivo atual ou a partir de
              outro dispositivo utilizando um QR Code.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 5,
              }}
            >
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#2a3439',
                  '&:hover': {
                    backgroundColor: '#7f4fb3',
                  },
                }}
              >
                Upload a partir da rede
              </Button>

              <Button
                component="label"
                variant="contained"
                sx={{
                  backgroundColor: '#2a3439',
                  '&:hover': {
                    backgroundColor: '#7f4fb3',
                  },
                }}
              >
                Upload local
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => localUpload(e)}
                />
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
