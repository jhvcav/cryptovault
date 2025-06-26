// src/components/layout/Navbar.tsx - VERSION RESPONSIVE FIXÉE
import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  Avatar,
  Text,
  Badge,
  VStack,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Container,
  useBreakpointValue,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';

// Types pour les liens de navigation
interface NavLink {
  label: string;
  href: string;
  icon?: string;
  requiresAuth?: boolean;
  badge?: string;
}

const Navbar: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, logout, isAuthenticated } = useAuth();
  const { balance, isConnected } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();

  // État pour le scroll
  const [scrolled, setScrolled] = useState(false);

  // Responsive values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const containerMaxW = useBreakpointValue({ base: 'full', md: 'container.xl' });
  const logoSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const avatarSize = useBreakpointValue({ base: 'sm', md: 'md' });

  // Couleurs
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Liens de navigation
  const navLinks: NavLink[] = [
    { label: 'Accueil', href: '/', icon: '🏠' },
    { label: 'Dashboard', href: '/dashboard', icon: '📊', requiresAuth: true },
    { label: 'Investir', href: '/invest', icon: '💰', requiresAuth: true },
    { label: 'NFT Collection', href: '/nft-collection', icon: '🎨', requiresAuth: true },
    { label: 'Historique', href: '/history', icon: '📈', requiresAuth: true },
    { label: 'Calculateur', href: '/yield-calculator', icon: '🧮', requiresAuth: true },
    { label: 'Roadmap', href: '/roadmap', icon: '🗺️' },
  ];

  // Gestion du scroll
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour vérifier si un lien est actif
  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Formatage de l'adresse wallet
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Formatage du solde
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.001) return '< 0.001';
    return num.toFixed(3);
  };

  // Composant NavLink pour la navigation
  const NavLinkComponent: React.FC<{ 
    navLink: NavLink; 
    onClose?: () => void; 
    isMobile?: boolean;
  }> = ({ navLink, onClose, isMobile = false }) => {
    if (navLink.requiresAuth && !isAuthenticated) return null;

    const isActive = isActiveLink(navLink.href);

    return (
      <Box
        as={Link}
        to={navLink.href}
        onClick={onClose}
        display="flex"
        alignItems="center"
        gap={2}
        px={isMobile ? 4 : 3}
        py={isMobile ? 3 : 2}
        borderRadius="lg"
        color={isActive ? 'blue.500' : 'gray.600'}
        bg={isActive ? 'blue.50' : 'transparent'}
        fontWeight={isActive ? 'bold' : 'medium'}
        fontSize={isMobile ? 'md' : 'sm'}
        transition="all 0.2s"
        _hover={{
          bg: isActive ? 'blue.100' : 'gray.50',
          color: isActive ? 'blue.600' : 'gray.800',
          transform: 'translateY(-1px)',
        }}
        _dark={{
          color: isActive ? 'blue.300' : 'gray.300',
          bg: isActive ? 'blue.900' : 'transparent',
          _hover: {
            bg: isActive ? 'blue.800' : 'gray.700',
            color: isActive ? 'blue.200' : 'gray.100',
          }
        }}
        w={isMobile ? 'full' : 'auto'}
      >
        {navLink.icon && (
          <Text fontSize={isMobile ? 'lg' : 'md'}>{navLink.icon}</Text>
        )}
        <Text>{navLink.label}</Text>
        {navLink.badge && (
          <Badge
            colorScheme="red"
            size="xs"
            borderRadius="full"
            px={1}
          >
            {navLink.badge}
          </Badge>
        )}
      </Box>
    );
  };

  return (
    <>
      {/* 🎯 NAVBAR PRINCIPALE RESPONSIVE */}
      <Box
        bg={scrolled ? 'rgba(255, 255, 255, 0.95)' : bgColor}
        backdropFilter={scrolled ? 'blur(10px)' : 'none'}
        borderBottom={scrolled ? '1px solid' : 'none'}
        borderColor={borderColor}
        transition="all 0.3s ease"
        position="sticky"
        top={0}
        zIndex={1000}
        w="100%"
        shadow={scrolled ? 'sm' : 'none'}
      >
        <Container maxW={containerMaxW} px={{ base: 2, md: 4 }}>
          <Flex
            h={{ base: 14, md: 16 }}
            alignItems="center"
            justifyContent="space-between"
            w="100%"
            gap={{ base: 2, md: 4 }}
          >
            {/* 🏠 LOGO - Partie gauche */}
            <Box
              as={Link}
              to="/"
              display="flex"
              alignItems="center"
              gap={2}
              flexShrink={0}
              _hover={{ transform: 'scale(1.05)' }}
              transition="transform 0.2s"
            >
              <Box
                w={{ base: 8, md: 10 }}
                h={{ base: 8, md: 10 }}
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                shadow="md"
              >
                <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="white">
                  C
                </Text>
              </Box>
              <VStack spacing={0} align="start" display={{ base: 'none', sm: 'flex' }}>
                <Text
                  fontSize={logoSize}
                  fontWeight="bold"
                  color="gray.800"
                  _dark={{ color: 'white' }}
                  lineHeight={1}
                >
                  CryptoVault
                </Text>
                <Text
                  fontSize="xs"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                  lineHeight={1}
                >
                  Secure Platform
                </Text>
              </VStack>
            </Box>

            {/* 📱 NAVIGATION DESKTOP - Partie centrale */}
            <HStack
              spacing={1}
              display={{ base: 'none', md: 'flex' }}
              flex={1}
              justify="center"
              maxW="600px"
            >
              {navLinks.map((navLink) => (
                <NavLinkComponent
                  key={navLink.href}
                  navLink={navLink}
                />
              ))}
            </HStack>

            {/* 👤 SECTION UTILISATEUR - Partie droite */}
            <Flex alignItems="center" gap={{ base: 1, md: 3 }} flexShrink={0}>
              {/* Informations utilisateur (desktop seulement) */}
              {isAuthenticated && !isMobile && (
                <VStack spacing={0} align="end" display={{ base: 'none', lg: 'flex' }}>
                  <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                    {formatAddress(user?.walletAddress || '')}
                  </Text>
                  <Text fontSize="xs" fontWeight="bold" color="green.600">
                    {formatBalance(balance)} BNB
                  </Text>
                </VStack>
              )}

              {/* Menu utilisateur */}
              {isAuthenticated ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size={avatarSize}
                    borderRadius="full"
                    p={0}
                    minW="auto"
                    h="auto"
                    _hover={{ transform: 'scale(1.05)' }}
                    _active={{ transform: 'scale(0.95)' }}
                  >
                    <Avatar
                      size={avatarSize}
                      name={user?.username}
                      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      color="white"
                    />
                  </MenuButton>
                  <MenuList 
                    shadow="xl" 
                    borderRadius="xl" 
                    border="1px solid"
                    borderColor={borderColor}
                    minW="200px"
                  >
                    <MenuItem icon={<Text>👤</Text>}>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{user?.username}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatAddress(user?.walletAddress || '')}
                        </Text>
                      </VStack>
                    </MenuItem>
                    <MenuItem icon={<Text>💰</Text>}>
                      <VStack align="start" spacing={0}>
                        <Text>Solde BNB</Text>
                        <Text fontSize="sm" color="green.600" fontWeight="bold">
                          {formatBalance(balance)} BNB
                        </Text>
                      </VStack>
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem icon={<Text>⚙️</Text>}>
                      Paramètres
                    </MenuItem>
                    <MenuItem icon={<Text>🛡️</Text>}>
                      Sécurité
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem
                      icon={<Text>🚪</Text>}
                      onClick={handleLogout}
                      color="red.500"
                      _hover={{ bg: 'red.50' }}
                      _dark={{ _hover: { bg: 'red.900' } }}
                    >
                      Déconnexion
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <Button
                  as={Link}
                  to="/login"
                  size={avatarSize}
                  colorScheme="blue"
                  variant="outline"
                  borderRadius="lg"
                  fontSize={{ base: 'xs', md: 'sm' }}
                  px={{ base: 3, md: 4 }}
                >
                  Connexion
                </Button>
              )}

              {/* 🍔 BOUTON HAMBURGER MOBILE - TOUJOURS VISIBLE */}
              <IconButton
                size={{ base: 'md', md: 'lg' }}
                icon={<HamburgerIcon />}
                aria-label="Ouvrir le menu"
                display={{ base: 'flex', md: 'none' }}
                onClick={onOpen}
                variant="ghost"
                colorScheme="blue"
                borderRadius="lg"
                minW={{ base: '40px', md: '48px' }}
                h={{ base: '40px', md: '48px' }}
                flexShrink={0}
                _hover={{
                  bg: 'blue.50',
                  transform: 'scale(1.05)',
                }}
                _dark={{
                  _hover: {
                    bg: 'blue.900',
                  }
                }}
              />
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* 📱 DRAWER MOBILE */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        size="sm"
      >
        <DrawerOverlay />
        <DrawerContent maxW="300px">
          <DrawerCloseButton
            size="lg"
            top={4}
            right={4}
            borderRadius="full"
            _hover={{ bg: 'red.50', color: 'red.500' }}
          />
          
          <DrawerHeader borderBottomWidth="1px" pb={4} pt={6}>
            <Flex align="center" gap={3}>
              <Box
                w={10}
                h={10}
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                shadow="md"
              >
                <Text fontSize="xl" fontWeight="bold" color="white">C</Text>
              </Box>
              <VStack spacing={0} align="start">
                <Text fontSize="lg" fontWeight="bold" color="gray.800" _dark={{ color: 'white' }}>
                  CryptoVault
                </Text>
                <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
                  Menu Navigation
                </Text>
              </VStack>
            </Flex>
          </DrawerHeader>

          <DrawerBody p={0}>
            {/* Informations utilisateur mobile */}
            {isAuthenticated && (
              <Box p={4} bg="gray.50" _dark={{ bg: 'gray.800' }} borderBottomWidth="1px">
                <Flex align="center" gap={3} mb={3}>
                  <Avatar
                    size="md"
                    name={user?.username}
                    bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    color="white"
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="md">{user?.username}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {formatAddress(user?.walletAddress || '')}
                    </Text>
                  </VStack>
                </Flex>
                
                <Box
                  bg="green.50"
                  _dark={{ bg: 'green.900' }}
                  p={3}
                  borderRadius="lg"
                  textAlign="center"
                >
                  <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                    Solde BNB
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                    {formatBalance(balance)} BNB
                  </Text>
                </Box>
              </Box>
            )}

            {/* Navigation mobile */}
            <VStack spacing={0} p={4} align="stretch">
              {navLinks.map((navLink) => (
                <NavLinkComponent
                  key={navLink.href}
                  navLink={navLink}
                  onClose={onClose}
                  isMobile={true}
                />
              ))}
              
              {/* Actions utilisateur */}
              {isAuthenticated && (
                <>
                  <Box h={4} />
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="gray.50"
                    _dark={{ bg: 'gray.700' }}
                  >
                    <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
                      Compte
                    </Text>
                    <VStack spacing={2} align="stretch">
                      <Button
                        variant="ghost"
                        size="sm"
                        justifyContent="start"
                        leftIcon={<Text>⚙️</Text>}
                        onClick={onClose}
                      >
                        Paramètres
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        justifyContent="start"
                        leftIcon={<Text>🛡️</Text>}
                        onClick={onClose}
                      >
                        Sécurité
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        justifyContent="start"
                        leftIcon={<Text>🚪</Text>}
                        color="red.500"
                        onClick={handleLogout}
                        _hover={{ bg: 'red.50' }}
                        _dark={{ _hover: { bg: 'red.900' } }}
                      >
                        Déconnexion
                      </Button>
                    </VStack>
                  </Box>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Navbar;