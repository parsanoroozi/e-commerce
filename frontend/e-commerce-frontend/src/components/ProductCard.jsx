import { Box, Button, Card, CardActions, CardContent, CardMedia, Chip, Typography } from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import {Link as RouterLink} from 'react-router-dom';
import StarRating from './StarRating';
import {resolveImageUrl} from '../utils/imageUrl';

export default function ProductCard({product, onRemove}) {
    const image = product.imageDetails?.find((entry) => entry.primaryImage) || product.imageDetails?.[0];
    const imageUrl = image?.url || product.imageUrl;
    const altText = image?.altText || product.name;
    const productPath = `/products/${product.slug || product.id}`;

    return (
        <Card
            className="luxury-product-card"
            sx={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transform: 'translateZ(0)',
                transition: 'transform 280ms ease, box-shadow 280ms ease, border-color 280ms ease',
                '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: 'primary.light',
                    boxShadow: '0 20px 48px rgba(115, 78, 35, 0.16)',
                },
                '& > *': {
                    position: 'relative',
                    zIndex: 1,
                },
            }}
        >
            <CardMedia
                component={RouterLink}
                to={productPath}
                sx={{
                    position: 'relative',
                    p: 1.25,
                    overflow: 'hidden',
                    textDecoration: 'none',
                }}
            >
                <Box
                    component="img"
                    src={resolveImageUrl(imageUrl)}
                    alt={altText}
                    loading="lazy"
                    sx={{
                        width: '100%',
                        height: {xs: 220, sm: 245},
                        objectFit: 'cover',
                        borderRadius: 2,
                        filter: 'saturate(1.04) contrast(1.04)',
                        transition: 'transform 420ms ease, filter 420ms ease',
                        '.MuiCard-root:hover &': {
                            transform: 'scale(1.035)',
                            filter: 'saturate(1.16) contrast(1.08)',
                        },
                    }}
                />
                <Chip
                    size="small"
                    label={product.categoryName}
                    sx={{
                        position: 'absolute',
                        top: 22,
                        left: 22,
                        color: 'primary.contrastText',
                        bgcolor: 'primary.main',
                        boxShadow: '0 12px 24px rgba(255,122,0,0.22)',
                    }}
                />
            </CardMedia>
            <CardContent sx={{flex: 1, px: 2.5, pt: 2}}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', fontWeight: 800 }}
                >
                    Available now
                </Typography>
                <Typography
                    component={RouterLink}
                    to={productPath}
                    variant="subtitle1"
                    fontWeight={800}
                    color="text.primary"
                    sx={{
                        display: 'block',
                        mt: 0.75,
                        minHeight: 48,
                        textDecoration: 'none',
                        '&:hover': {color: 'primary.main'},
                    }}
                >
                    {product.name}
                </Typography>
                {product.reviewCount > 0 && (
                    <Box sx={{mt: 0.5}}>
                        <StarRating value={product.averageRating} count={product.reviewCount}/>
                    </Box>
                )}
                <Typography
                    variant="h5"
                    color="primary"
                    sx={{
                        mt: 1.5,
                        fontWeight: 900,
                    }}
                >
                    ${Number(product.price).toFixed(2)}
                </Typography>
            </CardContent>
            <CardActions sx={{px: 2.5, pb: 2.5}}>
                <Button
                    component={RouterLink}
                    to={productPath}
                    variant="contained"
                    size="small"
                    fullWidth
                    endIcon={<ArrowOutwardIcon />}
                >
                    View product
                </Button>

                {onRemove && (
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => onRemove(product.id)}
                        sx={{
                            backgroundColor: 'error.main',
                            '&:hover': {
                                backgroundColor: 'error.dark',
                            },
                        }}
                    >
                        Remove
                    </Button>
                )}
            </CardActions>
        </Card>
    );
}
