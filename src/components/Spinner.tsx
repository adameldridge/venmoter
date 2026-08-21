import './Spinner.css';

type SpinnerProps = {
    size?: number;
};

export default function Spinner({ size = 14 }: SpinnerProps) {
    return (
        <span
            className="spinner"
            style={{ width: size, height: size }}
            aria-label="Loading"
        />
    );
}
