type HeroProps = {
  title: string;
  subtitle?: string;
};

const Hero = ({ title, subtitle }: HeroProps) => {
  return (
    <div className="w-full max-w-4xl text-center">
      <h1 className="hero-title-size font-cta font-bold leading-tight text-white">
        {title}
      </h1>
      {subtitle ? (
        <p className="type-subtitle mt-6 text-content-subtle md:text-xl lg:text-2xl">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
};

export default Hero;
