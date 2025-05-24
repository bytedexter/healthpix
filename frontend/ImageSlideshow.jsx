import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader

function ImageSlideshow() {
  return (
    <Carousel autoPlay infiniteLoop showThumbs={false}>
      <div>
        <img src="https://via.placeholder.com/800x400/007bff/ffffff?text=Slide+1" alt="Slide 1" />
      </div>
      <div>
        <img src="https://via.placeholder.com/800x400/6c757d/ffffff?text=Slide+2" alt="Slide 2" />
      </div>
      <div>
        <img src="https://via.placeholder.com/800x400/28a745/ffffff?text=Slide+3" alt="Slide 3" />
      </div>
      <div>
        <img src="https://via.placeholder.com/800x400/dc3545/ffffff?text=Slide+4" alt="Slide 4" />
      </div>
      <div>
        <img src="https://via.placeholder.com/800x400/ffc107/000000?text=Slide+5" alt="Slide 5" />
      </div>
    </Carousel>
  );
}

export default ImageSlideshow;
