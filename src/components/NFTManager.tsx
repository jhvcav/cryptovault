// src/components/NFTManager.tsx
import React, { useState, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Image,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  Heading,
  useToast
} from '@chakra-ui/react';

const NFTManager: React.FC = () => {
  const [mainText, setMainText] = useState('VAELITH DE SÈVE');
  const [subText, setSubText] = useState('LEGENDARY NFT COLLECTION');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toast = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateNFT = () => {
    if (!imagePreview) {
      toast({
        title: 'Erreur',
        description: 'Veuillez d\'abord charger une image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsGenerating(true);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) {
      setIsGenerating(false);
      return;
    }

    // Créer un élément Image du DOM
    const img = document.createElement('img');
    
    img.onload = () => {
      try {
        // Configurer le canvas
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        // Dessiner l'image
        ctx.drawImage(img, 0, 0);

        // Configurer le texte
        const fontSize = Math.max(canvas.width * 0.06, 40);
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';

        // Position du texte
        const textX = canvas.width / 2;
        const textY = canvas.height - fontSize * 1.5;

        // Ombre du texte
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Texte principal
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(mainText, textX, textY);

        // Sous-titre
        const subtitleSize = fontSize * 0.4;
        ctx.font = `${subtitleSize}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(subText, textX, textY + subtitleSize * 1.2);

        // Créer le lien de téléchargement
        const dataURL = canvas.toDataURL('image/png', 0.95);
        
        // Méthode de téléchargement plus robuste
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${mainText.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_NFT.png`;
            
            // Ajouter au DOM, cliquer, puis nettoyer
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setIsGenerating(false);
            toast({
              title: 'Succès',
              description: 'NFT généré et téléchargé !',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          } else {
            throw new Error('Impossible de créer le blob');
          }
        }, 'image/png', 0.95);

      } catch (error) {
        console.error('Erreur lors de la génération:', error);
        setIsGenerating(false);
        toast({
          title: 'Erreur',
          description: 'Erreur lors de la génération du NFT',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    img.onerror = () => {
      setIsGenerating(false);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    };

    // Charger l'image
    img.src = imagePreview;
  };

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* En-tête */}
        <Box textAlign="center">
          <Heading size="lg" color="orange.500" mb={2}>
            🎨 Créateur NFT
          </Heading>
          <Text color="gray.600">
            Ajoutez du texte personnalisé à vos images NFT
          </Text>
        </Box>

        <HStack spacing={6} align="start">
          {/* Colonne gauche - Controls */}
          <VStack spacing={4} flex="1" align="stretch">
            {/* Upload d'image */}
            <Box
              border="2px dashed"
              borderColor="orange.300"
              borderRadius="lg"
              p={6}
              textAlign="center"
              bg="orange.50"
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
              _hover={{ bg: 'orange.100' }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <Text fontSize="2xl" mb={2}>📸</Text>
              <Text color="orange.700" fontWeight="bold">
                Cliquez pour charger une image
              </Text>
              <Text color="orange.600" fontSize="sm">
                JPG, PNG, GIF acceptés
              </Text>
            </Box>

            {/* Champs de texte */}
            <FormControl>
              <FormLabel color="orange.700" fontWeight="bold">
                Nom principal
              </FormLabel>
              <Input
                value={mainText}
                onChange={(e) => setMainText(e.target.value)}
                bg="black-500"
                borderColor="orange.300"
                _focus={{ borderColor: 'orange.500', boxShadow: '0 0 0 1px orange.500' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="orange.700" fontWeight="bold">
                Sous-titre
              </FormLabel>
              <Input
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                bg="black-500"
                borderColor="orange.300"
                _focus={{ borderColor: 'orange.500', boxShadow: '0 0 0 1px orange.500' }}
              />
            </FormControl>

            {/* Bouton de génération */}
            <Button
              colorScheme="orange"
              size="lg"
              onClick={generateNFT}
              isLoading={isGenerating}
              loadingText="Génération..."
              isDisabled={!imagePreview}
              bgGradient="linear(135deg, orange.400, orange.600)"
              _hover={{ bgGradient: "linear(135deg, orange.500, orange.700)" }}
            >
              📥 Générer et Télécharger NFT
            </Button>
          </VStack>

          {/* Colonne droite - Aperçu */}
          <VStack flex="1" align="stretch">
            <Text color="orange.700" fontWeight="bold" textAlign="center">
              Aperçu
            </Text>
            {imagePreview ? (
              <Box position="relative" borderRadius="lg" overflow="hidden" border="2px solid" borderColor="orange.300">
                <Image src={imagePreview} alt="Aperçu" w="100%" />
                <Box
                  position="absolute"
                  bottom="0"
                  left="0"
                  right="0"
                  p={4}
                  textAlign="center"
                >
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color="white"
                    textShadow="2px 2px 4px rgba(0,0,0,0.8)"
                    mb={1}
                  >
                    {mainText}
                  </Text>
                  <Text
                    fontSize="sm"
                    color="rgba(255,255,255,0.8)"
                    textShadow="1px 1px 2px rgba(0,0,0,0.8)"
                  >
                    {subText}
                  </Text>
                </Box>
              </Box>
            ) : (
              <Box
                h="300px"
                border="2px dashed"
                borderColor="gray.300"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="gray.50"
              >
                <Text color="gray.500">L'aperçu apparaîtra ici</Text>
              </Box>
            )}
          </VStack>
        </HStack>

        {/* Canvas caché pour la génération */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Informations */}
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Instructions :</Text>
            <Text fontSize="sm">
              1. Chargez votre image • 2. Personnalisez le texte • 3. Cliquez sur "Générer" pour télécharger
            </Text>
          </Box>
        </Alert>
      </VStack>
    </Box>
  );
};

export default NFTManager;