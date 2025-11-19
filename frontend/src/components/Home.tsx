import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CatalogerButton from "./CatalogerButton";
import React from "react";

function Home() {
  const { t } = useTranslation();
  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("home.title")}
          </h1>
          <p className="text-xl text-gray-600 mb-8">{t("home.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Cataloger Option */}
          <ToolCard 
            title={t("home.cataloger.title")} 
            description={t("home.cataloger.description")} 
            button={<CatalogerButton />}
            iconColor="purple"
            iconBgColor="purple-100"
          />
          {/* Formatter Option */}
          <ToolCard 
            title={t("home.formatter.title")} 
            description={t("home.formatter.description")} 
            button={<Link to="/formatter" className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200">{t("home.formatter.button")}</Link>}
            iconColor="blue"
            iconBgColor="blue-100"
          />
          {/* Aligner Option */}
          <ToolCard 
            title={t("home.aligner.title")} 
            description={t("home.aligner.description")} 
            button={<Link to="/aligner" className="inline-block w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200">{t("home.aligner.button")}</Link>}
            iconColor="green"
            iconBgColor="green-100"
          />
        </div>

      </div>
    </div>
  );
}


const ToolCard = ({ 
  title, 
  description, 
  button,
  iconColor = "purple",
  iconBgColor = "purple-100"
}: { 
  title: string; 
  description: string; 
  button: React.ReactNode;
  iconColor?: "purple" | "blue" | "green";
  iconBgColor?: "purple-100" | "blue-100" | "green-100";
}) => {
  const iconColorClasses = {
    purple: "text-purple-600",
    blue: "text-blue-600",
    green: "text-green-600"
  };

  const iconBgClasses = {
    "purple-100": "bg-purple-100",
    "blue-100": "bg-blue-100",
    "green-100": "bg-green-100"
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
      <div className="text-center flex flex-col h-full">
        <div className={`w-16 h-16 ${iconBgClasses[iconBgColor]} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <svg
            className={`w-8 h-8 ${iconColorClasses[iconColor]}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {title}
        </h2>
        <p className="text-gray-600 mb-6 flex-1 leading-normal font-['jomo'] text-lg">
          {description}
        </p>
        {button}
      </div>
    </div>
  );
};

export default Home;
