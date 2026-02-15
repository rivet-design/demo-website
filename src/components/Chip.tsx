type ChipProps = {
  text: string;
};

const Chip = ({ text }: ChipProps) => {
  return (
    <div className="inline-block rounded-full bg-main-input px-6 py-2 font-knewave text-lg text-white shadow-lg">
      {text}
    </div>
  );
};

export default Chip;
