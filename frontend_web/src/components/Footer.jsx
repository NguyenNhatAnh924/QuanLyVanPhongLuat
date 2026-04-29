import React from "react";
import { Button, Input } from "antd"; 

// Dữ liệu menu
const MENUS = [
  {
    title: "Company",
    links: ["About Us", "Careers", "Premium Tools", "Blog"],
  },
  {
    title: "Pages",
    links: ["Login", "Register", "Add List", "Contact"],
  },
  {
    title: "Legal",
    links: ["Terms", "Privacy", "Team", "About Us"],
  },
];

export function Footer() {
  return (
    <footer className="w-full bg-white pt-16 pb-8 border-t border-blue-200">
      <div className="container mx-auto px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          
          {/* 3 CỘT MENU BÊN TRÁI */}
          {MENUS.map(({ title, links }) => (
            <div key={title} className="col-span-1">
              <h4 className="font-bold text-blue-900 text-lg mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="font-normal text-blue-700 hover:text-blue-900 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CỘT SUBSCRIBE BÊN PHẢI */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-blue-900 text-lg mb-2">Subscribe</h4>
            <p className="text-blue-800 mb-6 font-normal">
              Get access to subscriber exclusive deals and be the first who gets informed about fresh sales.
            </p>

            <div className="flex flex-col gap-2">
               <label className="text-sm font-medium text-blue-900">Your Email</label>
               <div className="flex gap-2">
                  <Input 
                    placeholder="Email" 
                    className="rounded-lg h-10 border-blue-300 hover:border-blue-900 focus:border-blue-900" 
                  />
                  <Button 
                    type="primary" 
                    className="bg-blue-900 hover:!bg-blue-800 text-white font-bold h-10 px-6 rounded-lg uppercase border-none"
                  >
                    Subscribe
                  </Button>
               </div>
               <p className="text-blue-600 text-sm mt-2">
                  I agree to the <a href="#" className="underline text-blue-800 hover:text-blue-900 font-medium">Terms and Conditions</a>
               </p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

export default Footer;