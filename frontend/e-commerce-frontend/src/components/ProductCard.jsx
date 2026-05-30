import {Box, Button, Card, CardActions, CardContent, CardMedia, Typography,} from '@mui/material';
import {Link as RouterLink} from 'react-router-dom';
import StarRating from './StarRating';
import {resolveImageUrl} from '../utils/imageUrl';

export default function ProductCard({product, onRemove}) {
    return (
        <Card sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <CardMedia
                component={RouterLink}
                to={`/products/${product.id}`}
                sx={{textDecoration: 'none'}}
            >
                <Box
                    component="img"
                    src={resolveImageUrl(product.imageUrl)}
                    alt={product.name}
                    loading="lazy"
                    sx={{width: '100%', height: {xs: 160, sm: 180}, objectFit: 'cover'}}
                />
            </CardMedia>
            <CardContent sx={{flex: 1}}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                    {product.categoryName}
                </Typography>
                <Typography
                    component={RouterLink}
                    to={`/products/${product.id}`}
                    variant="subtitle1"
                    fontWeight={600}
                    color="text.primary"
                    sx={{display: 'block', mt: 0.5, textDecoration: 'none', '&:hover': {color: 'primary.main'}}}
                >
                    {product.name}
                </Typography>
                {product.reviewCount > 0 && (
                    <Box sx={{mt: 0.5}}>
                        <StarRating value={product.averageRating} count={product.reviewCount}/>
                    </Box>
                )}
                <Typography variant="h6" color="primary" sx={{mt: 1}}>
                    ${Number(product.price).toFixed(2)}
                </Typography>
            </CardContent>
            <CardActions sx={{px: 2, pb: 2}}>
                <Button
                    component={RouterLink}
                    to={`/products/${product.id}`}
                    variant="outlined"
                    size="small"
                    fullWidth
                >
                    View details
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
