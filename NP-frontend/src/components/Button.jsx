// Reusable Button component with variant support
const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg focus:ring-emerald-500",
    secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md focus:ring-gray-200",
    outline: "border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500",
    white: "bg-white text-emerald-600 hover:bg-gray-50 shadow-md focus:ring-white",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
