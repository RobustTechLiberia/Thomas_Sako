import React from "react";
import team_member_1 from "../../../images/617521616_1984950405787294_11200720191272892_n.jpg";
import team_member_2 from "../../../images/Gemini_Generated_Image_61sds061sds061sd.jpeg";

class OurTeamGallery extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-wrap justify-center items-center md:justify-start md:mt-10 lg:mt-10 mt-8 lg:justify-start md:items-start lg:items-start gap-10 md:gap-0 md:mx-10 lg:mx-10 lg:gap-0 h-auto  pb-20">
          <div className="w-80 bg-gray-100 h-80">
            <img
              src={team_member_1}
              alt="Team mate 1"
              srcset=""
              className="h-64 object-cover w-full"
            />

            <div className="md:mt-0 lg:mt-0 mt-0 text-white text-lg text-center capitalize py-3 bg-[#830000]">
              philomena r koffa <br />{" "}
              <span className="font-bold">manager</span>
            </div>
          </div>
          <div className="w-80 bg-gray-50 h-80">
            <img
              src="{team_member_2}"
              alt="Team mate 2"
              srcset=""
              className="h-64 object-cover w-full"
            />
            <div className="md:mt-0 mt-0 lg:mt-0 text-white text-lg text-center capitalize py-3 bg-[#BC0202]">
              joseph arhin <br />{" "}
              <span className="font-bold">communication officer</span>
            </div>
          </div>
          <div className="w-80 bg-gray-200 h-80">
            <img
              src="{team_member_2}"
              alt="Team mate 2"
              srcset=""
              className="h-64 object-cover w-full"
            />
            <div className="md:mt-0 mt-0 lg:mt-0 text-white text-lg text-center capitalize py-3 bg-[#830000]">
              thomas m sarko <br />{" "}
              <span className="font-bold">chief executive officer</span>
            </div>
          </div>
          <div className="w-80 bg-gray-100 h-80">
            <img
              src={team_member_2}
              alt="Team mate 2"
              srcset=""
              className="h-64 object-cover w-full"
            />
            <div className="md:mt-0 mt-0 lg:mt-0 text-white text-lg text-center capitalize py-3 bg-[#BC0202]">
              gabriel w kun <br />{" "}
              <span className="font-bold">senior software developer</span>
            </div>{" "}
          </div>
          <div className="w-80 md:mt-5 lg:mt-4 mt-0 bg-gray-100 h-80">
            <img
              src="{team_member_2}"
              alt="Team mate 2"
              srcset=""
              className="h-64 object-cover w-full"
            />
            <div className="md:mt-0 mt-0 lg:mt-0 text-white text-lg text-center capitalize py-3 bg-[#830000]">
              christain t harris <br />{" "}
              <span className="font-bold">senior backend developer</span>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default OurTeamGallery;
