export default function Footer() {
  return (
    <footer className="bg-black text-white py-3 text-xs border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-3 md:mb-0 flex items-center">
            <div className="w-1 h-3 bg-orange-500 mr-2"></div>
            <span className="font-semibold tracking-wide text-bloomberg-xs">News</span>
          </div>
          
          
        </div>
        
        <div className="mt-3 text-center md:text-left text-gray-600">
          <p>Data is updated every 15 minutes. This service is for informational purposes only.</p>
        </div>
      </div>
    </footer>
  );
} 