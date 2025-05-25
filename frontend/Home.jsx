import React, { useState, useEffect, useRef } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import Chatbot from './Chatbot';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Paper,
  Container,
  CardMedia,
  CardActionArea,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  LocalPharmacy as MedicineIcon,
  CameraAlt as CameraIcon,
  PersonOutline as PersonIcon,
  ContactSupport as SupportIcon,
  Category as CategoryIcon,
  LocalShipping as ShippingIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Star as StarIcon,
  ForumOutlined as ForumIcon,
  MedicalServices as MedicalServicesIcon,
  LocalOffer as LocalOfferIcon,
  QuestionAnswer as QuestionAnswerIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Gemini API Key -  WARNING: Hardcoding API keys is insecure for production apps.
const GEMINI_API_KEY = 'AIzaSyD9mXvHQIGFEmPF1KeLXlLvnlxsi6st3MA';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// Styled components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  display: 'flex',
  alignItems: 'center',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  flexGrow: 1,
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

// Custom styled components for the enhanced design
const FeatureCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[10],
  },
}));

const BannerImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const FooterLink = styled(Typography)({
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline',
  },
});

function Home() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // Add state for tracking current view

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [orderDetails, setOrderDetails] = useState({
    address: '',
    phone: '',
    paymentMethod: 'cod'
  });

  // State for image analysis
  const fileInputRef = useRef(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [analysisError, setAnalysisError] = useState('');  // Sample slider images - replace with your actual images
  const sliderImages = [
    {
      url: '/health.png',
      title: 'Your Trusted Healthcare Partner',
      subtitle: 'Quality medications delivered to your doorstep',
    },
    {
      url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
      title: 'Consult with Expert Pharmacists',
      subtitle: 'Get professional advice for your medication needs',
    },
    {
      url: '/clinic.png',
      title: '24/7 Healthcare Support',
      subtitle: 'We\'re here for you anytime, anywhere',
    },
  ];

  // Feature cards data
  const featureCards = [
    {
      title: 'Order Medicines',
      description: 'Browse our extensive catalog of medicines',
      icon: <MedicalServicesIcon fontSize="large" />,
      action: () => setCurrentView('medicines'),
      color: '#4caf50',
    },
    {
      title: 'Order History',
      description: 'View your past orders and track deliveries',
      icon: <HistoryIcon fontSize="large" />,
      action: () => setCurrentView('history'),
      color: '#2196f3',
    },
    {
      title: 'Connect With Us',
      description: 'Chat with our healthcare professionals for expert advice',
      icon: <QuestionAnswerIcon fontSize="large" />,
      action: toggleChatbot,
      color: '#9c27b0',
    },
    {
      title: 'Browse Categories',
      description: 'Explore medicines by categories for easier navigation',
      icon: <CategoryIcon fontSize="large" />,
      action: () => setCurrentView('categories'),
      color: '#ff9800',
    },
  ];
  // Fetch medicines data when component mounts
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true); // Ensure loading is true at the start
        const apiUrl = import.meta.env.VITE_API_URL || 'https://healthpix-backend.onrender.com';
        const response = await fetch(`${apiUrl}/api/medicines`);
        if (!response.ok) {
          throw new Error('Failed to fetch medicines');
        }
        const data = await response.json();
        setMedicines(data);
        setFilteredMedicines(data);
        setError(null); // Clear any previous error
      } catch (err) {
        console.error('Error fetching medicines:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  // Check authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase().trim();
    setSearchQuery(query);

    if (query) {
      const filtered = medicines.filter((medicine) => {
        const searchableFields = [
          medicine['Medicine name'],
          medicine['Medicine Type'],
          medicine['Dosage'],
          medicine['Composition']
        ].map(field => field ? field.toLowerCase() : ''); // Ensure fields are strings and lowercase

        return searchableFields.some(field =>
          field.includes(query)
        );
      });
      console.log('Search query:', query, 'Results:', filtered.length);
      setFilteredMedicines(filtered);
      setCurrentView('medicines'); // Switch to medicines view when searching
    } else {
      setFilteredMedicines(medicines);
    }
  };

  const handleFilterChange = (event) => {
    const type = event.target.value;
    setFilterType(type);

    if (type === 'all') {
      setFilteredMedicines(medicines);
    } else {
      const filtered = medicines.filter(medicine =>
        (medicine.type || medicine['Medicine Type'])?.toLowerCase() === type.toLowerCase()
      );
      setFilteredMedicines(filtered);
    }
  };

  const addToCart = (medicine) => {
    // Use a unique identifier, ensure 'id' exists or fallback
    const medicineId = medicine.id || medicine['Medicine name']; // Example fallback
    setCart([...cart, { ...medicine, id: medicineId, quantity: 1 }]);
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter((item) => item.id !== medicineId));
  };

  const updateQuantity = (medicineId, quantity) => {
    setCart(
      cart.map((item) =>
        item.id === medicineId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  };

  const handlePlaceOrder = () => {
    if (!orderDetails.address || !orderDetails.phone) {
      alert("Please fill in address and phone number."); // Simple validation
      return;
    }

    const newOrder = {
      id: Date.now(),
      items: [...cart],
      total: getTotalPrice(),
      date: new Date().toISOString(),
      ...orderDetails
    };

    setOrderHistory([newOrder, ...orderHistory]);
    setCart([]);
    setCartDrawerOpen(false);
    setShowOrderDialog(true);
    setOrderDetails({
      address: '',
      phone: '',
      paymentMethod: 'cod'
    });
  };

  // Image analysis functions
  const handleCameraIconClick = () => {
    fileInputRef.current?.click();
  };

  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    setAnalysisResult('');
    setAnalysisError('');
    setShowAnalysisDialog(true); // Show dialog with loader

    try {
      const imagePart = await fileToGenerativePart(file);
      const prompt = `Analyze this image. Identify any medicines visible. For each medicine, provide its name and a brief description of its common uses or purpose. If the image does not contain any medicines or is not clear enough to identify any, respond with the exact phrase: "The uploaded image does not appear to be related to medicines or is not clear enough for analysis." Focus only on medicine identification and description, or the specific negative response.`;

      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            imagePart
          ]
        }],
      };

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
        const resultText = data.candidates[0].content.parts[0].text;
        setAnalysisResult(resultText);

        // Optional: if medicine names are found, try to search for them
        // This part is an extension and needs careful implementation based on how Gemini formats the names
        // For now, we just display the result.
        // Example: if (resultText.toLowerCase().includes("medicine name")) {
        //   const identifiedMedicineName = extractMedicineName(resultText); // You'd need a robust way to extract this
        //   setSearchQuery(identifiedMedicineName);
        //   handleSearch({ target: { value: identifiedMedicineName } }); // Trigger search
        // }

      } else if (data.promptFeedback && data.promptFeedback.blockReason) {
        setAnalysisError(`Image analysis blocked: ${data.promptFeedback.blockReason}. ${data.promptFeedback.blockReasonMessage || ''}`);
      }
      else {
        setAnalysisResult("Could not get a clear analysis from the image. The response might be empty or in an unexpected format.");
      }

    } catch (err) {
      console.error('Error analyzing image:', err);
      setAnalysisError(`Error analyzing image: ${err.message}`);
      setAnalysisResult(''); // Clear any previous result
    } finally {
      setIsAnalyzingImage(false);
      // Reset file input to allow uploading the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Render the medicines list
  const renderMedicinesList = () => {
    if (filteredMedicines.length === 0 && !loading) {
      return (
        <Grid item xs={12}>
          <Typography variant="h6" align="center" sx={{ mt: 4 }}>
            No medicines found matching your criteria.
          </Typography>
        </Grid>
      );
    }

    return filteredMedicines.map((medicine, index) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={medicine.id || medicine['Medicine name'] || index}>
        <Card sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            boxShadow: '0 12px 20px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-4px)',
            transition: 'all 0.3s ease'
          }
        }}>
          <CardContent sx={{ flexGrow: 1, p: 3 }}>
            <Typography gutterBottom variant="h6" component="h2" sx={{
              fontWeight: 600, mb: 2,
              color: 'primary.main'
            }}>
              {medicine['Medicine name'] || medicine.name || 'Unknown Medicine'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={medicine['Medicine Type'] || medicine.type || 'N/A'}
                color="primary"
                size="small"
                icon={<MedicineIcon />}
                sx={{ borderRadius: 1 }}
              />
              <Chip
                label={medicine.dosage || 'N/A'}
                color="secondary"
                size="small"
                sx={{ borderRadius: 1 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Composition:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{
              mb: 2,
              backgroundColor: 'background.paper',
              p: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              maxHeight: '100px', // Limit height for long compositions
              overflowY: 'auto'   // Add scroll for overflow
            }}>
              {medicine.composition || 'Not Available'}
            </Typography>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 'auto'
            }}>
              <Typography variant="h6" color="primary.main" sx={{
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center'
              }}>
                ₹{(medicine.price || 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color={medicine.stock > 0 ? 'success.main' : 'error.main'}>
                {medicine.stock > 0 ? `In Stock: ${medicine.stock}` : 'Out of Stock'}
              </Typography>
            </Box>
          </CardContent>
          <Box sx={{ p: 2, pt: 0 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => addToCart(medicine)}
              disabled={medicine.stock === 0 || cart.some(item => item.id === (medicine.id || medicine['Medicine name']))}
              sx={{
                borderRadius: 2,
                py: 1,
                boxShadow: 2,
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s'
                }
              }}
            >
              {cart.some(item => item.id === (medicine.id || medicine['Medicine name'])) ? 'Added to Cart' : 'Add to Cart'}
            </Button>
          </Box>
        </Card>
      </Grid>
    ));
  };

  // Render the home view with slider and feature cards
  const renderHomeView = () => {
    return (
      <>
        {/* Image Slider/Carousel Section */}
        <Box sx={{ mb: 4, mt: 2 }}>
          <Carousel
            showArrows={true}
            showStatus={false}
            showThumbs={false}
            infiniteLoop={true}
            autoPlay={true}
            interval={5000}
          >
            {sliderImages.map((image, index) => (
              <Box key={index} sx={{ position: 'relative', height: { xs: '200px', sm: '300px', md: '400px' } }}>
                <img 
                  src={image.url} 
                  alt={`Slide ${index + 1}`} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    p: { xs: 2, md: 4 },
                    textAlign: 'left'
                  }}
                >
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                    {image.title}
                  </Typography>
                  <Typography variant="subtitle1">
                    {image.subtitle}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Carousel>
        </Box>        {/* Feature Cards */}
        <Container maxWidth="lg" sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" sx={{ mb: 5, fontWeight: 600, textAlign: 'center' }}>
            Our Services
          </Typography>
          <Grid container spacing={4} sx={{ mb: 4, justifyContent: 'center', alignItems: 'stretch' }}>
            {/* First Row - Order Medicine and Order History */}
            <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
              <FeatureCard sx={{ flex: 1 }}>
                <CardActionArea onClick={featureCards[0].action} sx={{ height: '100%' }}>
                  <Box sx={{
                    bgcolor: alpha(featureCards[0].color, 0.1),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 4,
                    height: '100%',
                    justifyContent: 'center'
                  }}>
                    <Avatar sx={{ 
                      bgcolor: featureCards[0].color, 
                      width: 80, 
                      height: 80,
                      mb: 3,
                      '& .MuiSvgIcon-root': { fontSize: 45 } 
                    }}>
                      {featureCards[0].icon}
                    </Avatar>
                    <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                      {featureCards[0].title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
                      {featureCards[0].description}
                    </Typography>
                  </Box>
                </CardActionArea>
              </FeatureCard>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
              <FeatureCard sx={{ flex: 1 }}>
                <CardActionArea onClick={featureCards[1].action} sx={{ height: '100%' }}>
                  <Box sx={{
                    bgcolor: alpha(featureCards[1].color, 0.1),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 4,
                    height: '100%',
                    justifyContent: 'center'
                  }}>
                    <Avatar sx={{ 
                      bgcolor: featureCards[1].color, 
                      width: 80, 
                      height: 80,
                      mb: 3,
                      '& .MuiSvgIcon-root': { fontSize: 45 } 
                    }}>
                      {featureCards[1].icon}
                    </Avatar>
                    <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                      {featureCards[1].title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
                      {featureCards[1].description}
                    </Typography>
                  </Box>
                </CardActionArea>
              </FeatureCard>
            </Grid>
          </Grid>
          
          <Grid container spacing={4} sx={{ justifyContent: 'center', alignItems: 'stretch' }}>
            {/* Second Row - Connect With Us and Browse Categories */}
            <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
              <FeatureCard sx={{ flex: 1 }}>
                <CardActionArea onClick={featureCards[2].action} sx={{ height: '100%' }}>
                  <Box sx={{
                    bgcolor: alpha(featureCards[2].color, 0.1),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 4,
                    height: '100%',
                    justifyContent: 'center'
                  }}>
                    <Avatar sx={{ 
                      bgcolor: featureCards[2].color, 
                      width: 80, 
                      height: 80,
                      mb: 3,
                      '& .MuiSvgIcon-root': { fontSize: 45 } 
                    }}>
                      {featureCards[2].icon}
                    </Avatar>
                    <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                      {featureCards[2].title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
                      {featureCards[2].description}
                    </Typography>
                  </Box>
                </CardActionArea>
              </FeatureCard>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
              <FeatureCard sx={{ flex: 1 }}>
                <CardActionArea onClick={featureCards[3].action} sx={{ height: '100%' }}>
                  <Box sx={{
                    bgcolor: alpha(featureCards[3].color, 0.1),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 4,
                    height: '100%',
                    justifyContent: 'center'
                  }}>
                    <Avatar sx={{ 
                      bgcolor: featureCards[3].color, 
                      width: 80, 
                      height: 80,
                      mb: 3,
                      '& .MuiSvgIcon-root': { fontSize: 45 } 
                    }}>
                      {featureCards[3].icon}
                    </Avatar>
                    <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
                      {featureCards[3].title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
                      {featureCards[3].description}
                    </Typography>
                  </Box>
                </CardActionArea>
              </FeatureCard>
            </Grid>
          </Grid>
        </Container>

        {/* Testimonials or Trust Indicators */}
        <Box sx={{ mb: 6, bgcolor: 'background.paper', py: 5, borderRadius: 4 }}>
          <Container>            <Typography variant="h4" component="h2" sx={{ mb: 4, fontWeight: 600, textAlign: 'center' }}>
              Why Choose Clinicado?
            </Typography>
            <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  height: '100%', 
                  minHeight: '200px',
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 4,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  }
                }}>
                  <LocalOfferIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Best Prices Guaranteed</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    We offer competitive pricing on all medications to ensure affordability without compromising quality.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  height: '100%', 
                  minHeight: '200px',
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 4,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  }
                }}>
                  <ShippingIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Fast & Reliable Delivery</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Get your medications delivered to your doorstep quickly with our efficient delivery network.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  height: '100%', 
                  minHeight: '200px',
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 4,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  }
                }}>
                  <SupportIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Expert Healthcare Support</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Our team of healthcare professionals is available to provide guidance and answer your questions.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  height: '100%', 
                  minHeight: '200px',
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 4,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  }
                }}>
                  <CheckCircleIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Genuine Products</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    We ensure that all our products are authentic and sourced from trusted manufacturers and suppliers.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </>
    );
  };

  if (error && !loading) { // Only show error if not loading and error exists
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', p: 2, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Oops! Something went wrong.
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Medicines...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f7' }}>
      {/* Enhanced AppBar */}
      <AppBar position="fixed" elevation={2} sx={{ backgroundColor: '#ffffff', color: '#333' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>          <Box 
            sx={{ 
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setCurrentView('home')}
          >
            <img 
              src="./clinic.png" 
              alt="Clinicado Logo" 
              style={{ 
                height: '40px', 
                marginRight: '8px'
              }}
            />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                color: 'primary.main',
              }}
            >
              Clinicado
            </Typography>
          </Box>

          <Search sx={{ 
            backgroundColor: '#f0f2f5', 
            color: '#333',
            ml: 2,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: '#e4e6e9',
            },
          }}>
            <SearchIconWrapper>
              <SearchIcon sx={{ color: 'primary.main' }} />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={handleSearch}
              inputProps={{ 'aria-label': 'search' }}
            />
            <InputAdornment position="end">
              <IconButton
                aria-label="upload picture for search"
                onClick={handleCameraIconClick}
                edge="end"
                sx={{ color: 'primary.main', mr: 1 }}
              >
                <CameraIcon />
              </IconButton>
            </InputAdornment>
          </Search>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <Box sx={{ flexGrow: 1 }} />

          <IconButton 
            color="inherit" 
            onClick={() => setCartDrawerOpen(true)}
            sx={{ 
              backgroundColor: alpha('#e3f2fd', 0.5), 
              mr: 1,
              '&:hover': {
                backgroundColor: alpha('#e3f2fd', 0.8),
              }
            }}
          >
            <Badge badgeContent={cart.length} color="error">
              <CartIcon sx={{ color: 'primary.main' }} />
            </Badge>
          </IconButton>

          <IconButton
            color="inherit"
            onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
            sx={{ 
              backgroundColor: alpha('#e3f2fd', 0.5),
              '&:hover': {
                backgroundColor: alpha('#e3f2fd', 0.8),
              }
            }}
          >
            <PersonIcon sx={{ color: 'primary.main' }} />
          </IconButton>
        </Toolbar>
        
        {/* Optional: Navigation tabs */}
        <Tabs 
          value={currentView === 'home' ? 0 : currentView === 'medicines' ? 1 : currentView === 'categories' ? 2 : 3}
          onChange={(e, newValue) => {
            setCurrentView(newValue === 0 ? 'home' : newValue === 1 ? 'medicines' : newValue === 2 ? 'categories' : 'history');
          }}
          sx={{ 
            bgcolor: '#f8f9fa',
            '& .MuiTab-root': { 
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9rem'
            }
          }}
          centered
        >
          <Tab label="Home" icon={<DashboardIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
          <Tab label="Medicines" icon={<MedicineIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
          <Tab label="Categories" icon={<CategoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
          <Tab label="Order History" icon={<HistoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
        </Tabs>
      </AppBar>

      {/* Add toolbar spacing */}
      <Toolbar />
      <Toolbar sx={{ display: { xs: 'block', sm: 'block' } }} /> {/* Extra space for tabs */}

      {/* Main content */}
      <Container maxWidth="xl" sx={{ pt: 3, pb: 8, flexGrow: 1 }}>
        {currentView === 'home' ? (
          renderHomeView()
        ) : (
          <Grid container spacing={3}>
            {currentView === 'medicines' && renderMedicinesList()}
            {currentView === 'categories' && (
              <Grid item xs={12}>
                <Typography variant="h4" sx={{ mb: 4, fontWeight: 600, textAlign: 'center' }}>
                  Browse by Categories
                </Typography>
                <Grid container spacing={3}>
                  {['Antibiotics', 'Painkillers', 'Vitamins', 'Supplements', 'First Aid', 'Skin Care', 'Diabetes Care', 'Cardiac Care'].map((category, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        '&:hover': {
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                          transform: 'translateY(-4px)',
                          transition: 'all 0.3s ease'
                        }
                      }}>
                        <MedicineIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {category}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
            {currentView === 'history' && (
              <Grid item xs={12}>
                <Typography variant="h4" sx={{ mb: 4, fontWeight: 600, textAlign: 'center' }}>
                  Your Order History
                </Typography>
                {orderHistory.length > 0 ? (
                  <Grid container spacing={3}>
                    {orderHistory.map((order) => (
                      <Grid item xs={12} key={order.id}>
                        <Card sx={{ p: 3, borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                              Order #{order.id.toString().slice(-5)}
                            </Typography>
                            <Chip 
                              label="Delivered" 
                              color="success" 
                              size="small" 
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Date: {new Date(order.date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Items: {order.items.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Shipping Address: {order.address}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Payment Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'card' ? 'Credit/Debit Card' : 'UPI'}
                            </Typography>
                            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                              Total: ₹{order.total.toFixed(2)}
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8, 
                    px: 3,
                    bgcolor: 'background.paper',
                    borderRadius: 2
                  }}>
                    <HistoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No order history yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Your order history will appear here once you place an order.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => setCurrentView('medicines')}
                      startIcon={<MedicineIcon />}
                    >
                      Browse Medicines
                    </Button>
                  </Box>
                )}
              </Grid>
            )}
          </Grid>
        )}
      </Container>      {/* Enhanced Chatbot Icon */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {!showChatbot && (
          <Box
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              py: 1,
              px: 2,
              borderRadius: 2,
              mb: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              animation: 'fadeIn 0.5s',
              '@keyframes fadeIn': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(10px)'
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              },
              visibility: { xs: 'hidden', sm: 'visible' }
            }}
          >
            Need help? Chat with us!
          </Box>
        )}
        <IconButton
          aria-label="open chatbot"
          onClick={toggleChatbot}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            width: 60,
            height: 60,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              backgroundColor: 'primary.dark',
              transform: 'scale(1.05)',
              transition: 'all 0.3s ease'
            }
          }}
        >
          <ForumIcon sx={{ fontSize: 30 }} />
        </IconButton>
      </Box>

      {showChatbot && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: { xs: '90%', sm: 360 },
            height: { xs: '70vh', sm: 500 },
            zIndex: 1050,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ForumIcon sx={{ mr: 1 }} />              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Clinicado Assistant
              </Typography>
            </Box>
            <IconButton size="small" onClick={toggleChatbot} sx={{ color: 'white' }}>
              ×
            </IconButton>
          </Box>          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Chatbot onClose={toggleChatbot} />
          </Box>
        </Box>
      )}

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 280 }} role="presentation">
          <Box sx={{ 
            p: 3, 
            backgroundColor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Avatar sx={{ bgcolor: '#fff', color: 'primary.main', mr: 2 }}>
              {auth.currentUser?.email?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>
                {auth.currentUser?.displayName || 'User'}
              </Typography>
              <Typography variant="body2" noWrap title={auth.currentUser?.email}>
                {auth.currentUser?.email || 'user@example.com'}
              </Typography>
            </Box>
          </Box>
          <List sx={{ pt: 1 }}>
            <ListItem button onClick={() => {setCurrentView('home'); setDrawerOpen(false);}}>
              <ListItemIcon>
                <DashboardIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem button onClick={() => {setCurrentView('medicines'); setDrawerOpen(false);}}>
              <ListItemIcon>
                <MedicineIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Medicines" />
            </ListItem>
            <ListItem button onClick={() => {setCurrentView('categories'); setDrawerOpen(false);}}>
              <ListItemIcon>
                <CategoryIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Categories" />
            </ListItem>
            <ListItem button onClick={() => {setCurrentView('history'); setDrawerOpen(false);}}>
              <ListItemIcon>
                <HistoryIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Order History" />
            </ListItem>
            
            <Divider sx={{ my: 2 }} />
            
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon color="error" />
              </ListItemIcon>
              <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Cart Drawer */}
      <Drawer
        anchor="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
      >
        <Box sx={{ width: { xs: '100vw', sm: 420 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            p: 3, 
            backgroundColor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}>
            <CartIcon sx={{ mr: 2 }} />
            <Typography variant="h6">
              Shopping Cart
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
            {cart.length > 0 ? (
              <List sx={{ mb: 2 }}>
                {cart.map((item) => (
                  <ListItem 
                    key={item.id || item.name} 
                    sx={{ 
                      display: 'block', 
                      mb: 2, 
                      backgroundColor: 'background.paper',
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      p: 2
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {item.name || item['Medicine name']}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip
                          label={item.type || item['Medicine Type'] || 'N/A'}
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                        <Chip
                          label={item.dosage || 'N/A'}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          sx={{ minWidth: '30px', height: '30px', p: 0 }}
                        >
                          -
                        </Button>
                        <Typography sx={{ mx: 2, fontWeight: 500 }}>{item.quantity}</Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          sx={{ minWidth: '30px', height: '30px', p: 0 }}
                        >
                          +
                        </Button>
                        <Typography sx={{ ml: 'auto', fontWeight: 'bold' }}>
                          ₹{((item.price || 0) * item.quantity).toFixed(2)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(item.id)}
                          sx={{ ml: 1, color: 'error.main' }}
                          aria-label="remove from cart"
                        >
                          ×
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <CartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Your cart is empty
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Add some medicines to your cart to proceed with checkout.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => {setCurrentView('medicines'); setCartDrawerOpen(false);}}
                >
                  Browse Medicines
                </Button>
              </Box>
            )}
          </Box>

          {cart.length > 0 && (
            <Box sx={{ 
              p: 3, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              backgroundColor: '#f9f9f9'
            }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
                Order Summary
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Delivery Address"
                  multiline
                  rows={2}
                  value={orderDetails.address}
                  onChange={(e) => setOrderDetails({ ...orderDetails, address: e.target.value })}
                  margin="normal"
                  required
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={orderDetails.phone}
                  onChange={(e) => setOrderDetails({ ...orderDetails, phone: e.target.value })}
                  margin="normal"
                  type="tel"
                  required
                  variant="outlined"
                />
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={orderDetails.paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setOrderDetails({ ...orderDetails, paymentMethod: e.target.value })}
                  >
                    <MenuItem value="cod">Cash on Delivery</MenuItem>
                    <MenuItem value="card">Credit/Debit Card (Simulated)</MenuItem>
                    <MenuItem value="upi">UPI (Simulated)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                pb: 2,
                borderBottom: '1px dashed',
                borderColor: 'divider'
              }}>
                <Typography variant="body1">
                  Subtotal ({cart.reduce((total, item) => total + item.quantity, 0)} items)
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  ₹{getTotalPrice().toFixed(2)}
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="body1">
                  Delivery Fee
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  ₹0.00
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h6">
                  Total
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ₹{getTotalPrice().toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ 
                  py: 1.5, 
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                  }
                }}
                onClick={handlePlaceOrder}
                disabled={!orderDetails.address || !orderDetails.phone || cart.length === 0}
              >
                Place Order
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={() => setProfileMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            overflow: 'visible',
            width: 200,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >        <MenuItem onClick={() => { 
          setProfileMenuAnchor(null);
          // Show profile dialog or navigate to profile page
          alert('Profile functionality will be implemented in the next update');
        }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { setCurrentView('history'); setProfileMenuAnchor(null); }}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          My Orders
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleLogout(); setProfileMenuAnchor(null); }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Order Confirmation Dialog */}
      <Dialog
        open={showOrderDialog}
        onClose={() => setShowOrderDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: { xs: '90%', sm: 500 }
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'success.light', 
          color: 'success.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <CheckCircleIcon /> Order Placed Successfully!
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <DialogContentText>
            Thank you for your order. We will process it shortly and deliver to the provided address.
            You will receive updates about your order on your phone number.
          </DialogContentText>
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Order Reference: #{Date.now().toString().slice(-8)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please keep this reference number for future inquiries.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowOrderDialog(false)} color="primary" variant="contained">
            Close
          </Button>
          <Button 
            onClick={() => {
              setShowOrderDialog(false);
              setCurrentView('history');
            }} 
            variant="outlined"
          >
            View Orders
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Analysis Dialog */}
      <Dialog
        open={showAnalysisDialog}
        onClose={() => {
          setShowAnalysisDialog(false);
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.light', 
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <CameraIcon /> Image Analysis Result
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {isAnalyzingImage ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <CircularProgress size={60} />
              <Typography sx={{ mt: 3 }}>Analyzing image, please wait...</Typography>
            </Box>
          ) : analysisError ? (
            <DialogContentText color="error" sx={{ whiteSpace: 'pre-wrap' }}>
              {analysisError}
            </DialogContentText>
          ) : analysisResult ? (
            <Box>
              <DialogContentText sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
                {analysisResult}
              </DialogContentText>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={() => {
                  setShowAnalysisDialog(false);
                  setCurrentView('medicines');
                }}
                sx={{ mt: 2 }}
              >
                Browse Related Medicines
              </Button>
            </Box>
          ) : (
            <DialogContentText>
              No analysis result to display.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowAnalysisDialog(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Box component="footer" sx={{ 
        bgcolor: '#1a237e', 
        color: 'white',
        py: 6,
        mt: 'auto'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Clinicado
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                Your trusted healthcare partner. We provide high-quality medications and healthcare products at affordable prices.
              </Typography>              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <IconButton size="small" sx={{ color: 'white' }} onClick={() => window.open('https://facebook.com', '_blank')}>
                  <FacebookIcon />
                </IconButton>
                <IconButton size="small" sx={{ color: 'white' }} onClick={() => window.open('https://twitter.com', '_blank')}>
                  <TwitterIcon />
                </IconButton>
                <IconButton size="small" sx={{ color: 'white' }} onClick={() => window.open('https://instagram.com', '_blank')}>
                  <InstagramIcon />
                </IconButton>
                <IconButton size="small" sx={{ color: 'white' }} onClick={() => window.open('https://linkedin.com', '_blank')}>
                  <LinkedInIcon />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
                Quick Links
              </Typography>              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <FooterLink variant="body2" sx={{ opacity: 0.8 }} onClick={() => setCurrentView('home')}>Home</FooterLink>
                <FooterLink variant="body2" sx={{ opacity: 0.8 }} onClick={() => alert('About Us page coming soon!')}>About Us</FooterLink>
                <FooterLink variant="body2" sx={{ opacity: 0.8 }} onClick={() => setCurrentView('medicines')}>Services</FooterLink>
                <FooterLink variant="body2" sx={{ opacity: 0.8 }} onClick={() => alert('Contact page coming soon!')}>Contact</FooterLink>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
                Services
              </Typography>              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <FooterLink variant="body2" sx={{ opacity: 0.8 }} onClick={() => setCurrentView('medicines')}>Order Medicines</FooterLink>
                <FooterLink variant="body2" sx={{ opacity: 0.8 }} onClick={() => setCurrentView('categories')}>Healthcare Products</FooterLink>
                <FooterLink variant="body2" sx={{ opacity: 0.8 }} onClick={() => alert('Lab Tests feature coming soon!')}>Lab Tests</FooterLink>
                <FooterLink variant="body2" sx={{ opacity: 0.8 }} onClick={() => alert('Health Articles coming soon!')}>Health Articles</FooterLink>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
                Contact Us
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PhoneIcon fontSize="small" />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    +91 123 456 7890
                  </Typography>
                </Box>                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    support@clinicado.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <LocationOnIcon fontSize="small" />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    123 Healthcare Avenue, Medical District, New Delhi, India
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 4 }} />
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'center', md: 'space-between' },
            alignItems: 'center',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 0 }
          }}>            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © {new Date().getFullYear()} Clinicado. All rights reserved.
            </Typography>            <Box sx={{ display: 'flex', gap: 3 }}>
              <FooterLink variant="body2" sx={{ opacity: 0.7 }} onClick={() => alert('Privacy Policy page coming soon!')}>Privacy Policy</FooterLink>
              <FooterLink variant="body2" sx={{ opacity: 0.7 }} onClick={() => alert('Terms of Service page coming soon!')}>Terms of Service</FooterLink>
              <FooterLink variant="body2" sx={{ opacity: 0.7 }} onClick={() => alert('Refund Policy page coming soon!')}>Refund Policy</FooterLink>
            </Box>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}

export default Home;