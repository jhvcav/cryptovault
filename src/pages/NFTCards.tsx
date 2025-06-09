import React from 'react';
import { Box, Text, Flex, Grid, GridItem } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface NFTCardProps {
  title: string;
  subtitle: string;
  accessLevel: string;
  icon: string;
  cardNumber: string;
  colorScheme: 'bronze' | 'silver' | 'gold' | 'privilege';
}

const NFTCard: React.FC<NFTCardProps> = ({
  title,
  subtitle,
  accessLevel,
  icon,
  cardNumber,
  colorScheme
}) => {
  const colorSchemes = {
    bronze: {
      background: 'linear-gradient(135deg, #cd7f32 0%, #8b4513 25%, #a0522d 50%, #daa520 75%, #cd7f32 100%)',
      borderColor: '#8b4513',
      shadowColor: 'rgba(205, 127, 50, 0.3)',
      glowColor: 'linear-gradient(45deg, #cd7f32, #daa520, #8b4513)',
    },
    silver: {
      background: 'linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 25%, #a8a8a8 50%, #d3d3d3 75%, #e8e8e8 100%)',
      borderColor: '#a8a8a8',
      shadowColor: 'rgba(192, 192, 192, 0.3)',
      glowColor: 'linear-gradient(45deg, #e8e8e8, #c0c0c0, #a8a8a8)',
    },
    gold: {
      background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 25%, #ff8c00 50%, #ffa500 75%, #ffd700 100%)',
      borderColor: '#ff8c00',
      shadowColor: 'rgba(255, 215, 0, 0.4)',
      glowColor: 'linear-gradient(45deg, #ffd700, #ffb347, #ff8c00)',
    },
    privilege: {
      background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 20%, #e74c3c 40%, #f39c12 60%, #e67e22 80%, #9b59b6 100%)',
      borderColor: '#8e44ad',
      shadowColor: 'rgba(155, 89, 182, 0.4)',
      glowColor: 'linear-gradient(45deg, #9b59b6, #e74c3c, #f39c12, #8e44ad)',
    },
  };

  const scheme = colorSchemes[colorScheme];

  return (
    <MotionBox
      position="relative"
      w="100%"
      h="400px"
      borderRadius="20px"
      overflow="hidden"
      cursor="pointer"
      border="3px solid"
      borderColor={scheme.borderColor}
      bgGradient={scheme.background}
      boxShadow={`0 15px 35px ${scheme.shadowColor}, inset 0 0 20px rgba(255,255,255,0.1)`}
      whileHover={{
        y: -10,
        scale: 1.02,
        boxShadow: `0 25px 50px ${scheme.shadowColor.replace('0.3', '0.5').replace('0.4', '0.6')}, inset 0 0 30px rgba(255,255,255,0.2)`
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow Effect */}
      <Box
        position="absolute"
        top="-2px"
        left="-2px"
        right="-2px"
        bottom="-2px"
        borderRadius="22px"
        bgGradient={scheme.glowColor}
        opacity={0}
        _hover={{ opacity: 0.7 }}
        transition="opacity 0.3s ease"
        animation="glowPulse 2s ease-in-out infinite alternate"
        sx={{
          '@keyframes glowPulse': {
            '0%': { opacity: 0.5 },
            '100%': { opacity: 1 }
          }
        }}
      />

      {/* Shimmer Effect */}
      <Box
        position="absolute"
        top="-50%"
        left="-50%"
        w="200%"
        h="200%"
        bgGradient="linear(45deg, transparent, rgba(255,255,255,0.1), transparent)"
        animation="shimmer 3s infinite"
        sx={{
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
            '100%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' }
          }
        }}
      />

      {/* Overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0,0,0,0.3)"
        backdropFilter="blur(1px)"
      />

      {/* Content */}
      <Flex
        position="relative"
        zIndex={2}
        h="100%"
        direction="column"
        justify="space-between"
        p={8}
        color="white"
      >
        {/* Header */}
        <Box textAlign="center">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            mb={2}
            textShadow="2px 2px 4px rgba(0,0,0,0.5)"
          >
            {title}
          </Text>
          <Text
            fontSize="md"
            opacity={0.9}
            textShadow="1px 1px 2px rgba(0,0,0,0.5)"
          >
            {subtitle}
          </Text>
        </Box>

        {/* Center Icon */}
        <Flex justify="center" align="center" flex={1}>
          <Flex
            w="80px"
            h="80px"
            borderRadius="50%"
            bg="rgba(255,255,255,0.2)"
            align="center"
            justify="center"
            fontSize="2.5rem"
            backdropFilter="blur(10px)"
            border="2px solid rgba(255,255,255,0.3)"
          >
            {icon}
          </Flex>
        </Flex>

        {/* Footer */}
        <Box textAlign="center">
          <Text fontSize="sm" opacity={0.8} mb={4}>
            Niveau d'Accès: {accessLevel}
          </Text>
          <Text
            fontSize="xl"
            fontWeight="bold"
            fontFamily="'Courier New', monospace"
            textShadow="1px 1px 2px rgba(0,0,0,0.5)"
          >
            {cardNumber}
          </Text>
        </Box>
      </Flex>
    </MotionBox>
  );
};

const NFTCards: React.FC = () => {
  const cards = [
    {
      title: 'NFT BRONZE',
      subtitle: 'Accès de Base',
      accessLevel: 'Essentiel',
      icon: '🥉',
      cardNumber: '#001',
      colorScheme: 'bronze' as const,
    },
    {
      title: 'NFT ARGENT',
      subtitle: 'Accès Intermédiaire',
      accessLevel: 'Avancé',
      icon: '🥈',
      cardNumber: '#002',
      colorScheme: 'silver' as const,
    },
    {
      title: 'NFT GOLD',
      subtitle: 'Accès Premium',
      accessLevel: 'Premium',
      icon: '🥇',
      cardNumber: '#003',
      colorScheme: 'gold' as const,
    },
    {
      title: 'NFT PRIVILÈGE',
      subtitle: 'Accès Exclusif',
      accessLevel: 'Exclusif',
      icon: '💎',
      cardNumber: '#004',
      colorScheme: 'privilege' as const,
    },
  ];

  return (
    <Box
      minH="100vh"
      bgGradient="transparent"
      py={10}
      px={5}
    >
      <MotionFlex
        direction="column"
        align="center"
        maxW="1400px"
        mx="auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Text
          color="blue.500"
          fontSize={{ base: '2xl', md: '4xl' }}
          fontWeight="bold"
          mb={10}
          textAlign="center"
          textShadow="2px 2px 4px rgba(0,0,0,0.3)"
          border="3px solid"
            borderColor="blue.400"
            borderRadius="xl"
            bg="rgba(255,255,255,0.05)"
            p={8}
            boxShadow="0 4px 20px rgba(0,0,0,0.1)"
            py={3}
            px={7}
        >
          Collection NFT - Droit d'Accès à la Plateforme
        </Text>

        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)'
          }}
          gap={8}
          w="100%"
        >
          {cards.map((card, index) => (
            <GridItem key={card.cardNumber}>
              <MotionBox
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <NFTCard {...card} />
              </MotionBox>
            </GridItem>
          ))}
        </Grid>
      </MotionFlex>
    </Box>
  );
};

export default NFTCards;