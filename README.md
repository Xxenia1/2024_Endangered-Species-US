#  Endangered Species Throughout U.S. States
An interactive web map and data visualization tool, offering a comprehansive view of the current state of endangered species throughtout the United States

## Team Members
Zhiyi Li and Xun Gong

## Final Proposal
### Target user profile (persona):
**Name & Position:** **Alex Morgan, Environmental Educator**     
**Background Description:** 
The following scenario describes the use of Endangered Species Tracker for United States by Alex Morgan, a didicated environmental educator preparing to engage middle school students in understanding biodiversity and the significance of conservation efforts. Traditional educational materials, often laden with dense text and complex tables, prove ineffective in capturing the attention of young learners and are inadequate for conveying the nuances of endangered species' numbers, locations, and conservation statuses directly and engagingly. Alex, deeply committed to endangered species protection and environmental activism, uses the web map as a centralized and accurate **<ins>resource</ins>** for data on endangered, threatened, recovered, and extinct species. Facing the challenge of presenting complex conservation statuses and species distribution in an educational setting, Alex plans to use the map not just for **<ins>data exploration</ins>** but also as a **<ins>presentation tool</ins>** to illustrate complex **<ins>trends</ins>** and **<ins>clusters</ins>** in biodiversity. The web map is designed to be accessible on multiple devices, ensuring Alex can access and display information fluidly in diverse environments such as classrooms or outdoor settings. With features like an Introduction Panel, Chart Toggle, Search Widget, Information Panel, and flexible Map Operations, Alex aims to **<ins>retrieve</ins>** and **<ins>filter</ins>** specific data, **<ins>compare</ins>** and **<ins>analyze</ins>** patterns shown on the map, making conservation issues more visible and engaging for students. By leveraging this Endangered Species Tracker for the United States, Alex seeks to enhance his educational outreach, making a substantial impact on young minds by raising awareness about the critical need for conservation efforts to protect our planet's biodiversity.      
### User case scenarios: 
**Scenario #1:** 
Upon launching the Endangered Species Tracker, Alex Morgan, an environmental educator, is set to engage a class of middle school students in California on the topic of biodiversity and conservation. The classroom's smartboard displays the tracker's interface, featuring a map marked with proportional symbols that indicate the number of endangered species in each U.S. state. Captivated by the visual display, students are invited by Alex to **<ins>explore</ins>** the map. As they select California, **<ins>details</ins>** about specific species groups in California appear on the right panel, enriching their understanding of local biodiversity. Alex then uses the adjacent bar chart, "Number of Grand Total in each state," to facilitate a **<ins>comparative</ins>** analysis. He explains the significance of the data, particularly highlighting Hawaii, which has the highest level of endangered species, to underscore the urgency of conservation efforts. Next, Alex demonstrates the "Search for a state" feature, which allows students to find data on states they are curious about, thereby personalizing their learning experience. This interactive exploration culminates in a class discussion about potential conservation actions, emphasizing the role of environmental policies and personal efforts in species preservation. To reinforce the day's learning, Alex assigns a project where students will use the Endangered Species Tracker to research the species in a state of their interests. students will share their discoveries and thoughts in an open discussion next class. This scenario showcases how the Endangered Species Tracker not only serves as an educational tool but also as a means to foster environmental awareness and proactive engagement among students.

**Scenario #2:**
In an educational session, Alex Morgan introduces his middle school class to the study of lichens using the Endangered Species Tracker, displayed on a smartboard. Starting with the main interface, Alex guides the students to select "Lichens" from the "Select Attribute" dropdown menu, which **<ins>filters</ins>** the map to focus solely on the data relevant to lichens. This **<ins>filtering</ins>** allows for more targeted exploration of biodiversity, simplifies the visual information and focuses the discussion on this particular species group. The class observes that states like Oregon, located in the northwestern part of the United States, have higher **<ins>concertrations</ins>** of endangered lichens, as indicated by the "Number of Lichens in each state" bar chart that updates dynamically. Alex then encourages the students to delve deeper into the specifics of lichen species by clicking on states with notable lichen populations, as shown on the map. This interaction reveals **<ins>detailed</ins>** information about each lichen species, including their conservation status and the particular threats they face, all displayed in the right panel. To foster a more interactive session, he divides the students into small groups, assigning each group a different state to research the specific endangered lichen species found there. In the next class, the groups share their findings, discussing potential conservation actions that could help preserve lichen species in their respective states. The session concludes with a class-wide discussion on the broader implications of species conservation, exploring how the preservation of a less-known group like lichens can impact biodiversity and ecological health on a national level. 
### Requirements Document
**1. Representation**
    1. Basemap: The outline boundary of the World's Countries and the United States (state boundary included): Natural Earth
    2. Listed species with spatial current range believed to or known to occur in each state: https://ecos.fws.gov/ecp/report/species-listings-by-state-totals?statusCategory=Listed     
       Organize this data into two CSV files:
       1. Species lists in each state, including detailed information like Scientific Name, Common Name, Status...
       2. Number of species in each group based on states
    3. Overview: Introduction and supplementary text on the background description and user guideline
    4. Statistics: Create a bar chart displaying the number of endangered species in each state.

**2. Interaction**
    1. Introduction Panel: Overlay: Show intro info
    2. Query Panel: Filter: By species group.
    3. Chart Toggle: Overlay: Turn on/off the charts showing statistics information; Reexpress: use charts show some information including in the map 
    4. Search Widget: Search: Search for state of interest
    5. Information Panel: Retrieve: Show more information about the species when clicking on a specific state
    6. Map Operations: Zoom: Flexible for zooming; click on the reset button to reset the map; Pan: Flexible for paning; click on the reset button to reset the map

***Other Reference:***  
     
*Interactive map example of related topics: https://center.maps.arcgis.com/apps/webappviewer/index.html?id=def877f10b304220beab7ee8b19f1533* 
     
*Endangered species habitats:*      
*The distribution of different endangered species from Environmental Conservation Online System: USFWS Threatened & Endangered Species Active Critical Habitat Report: https://ecos.fws.gov/ecp/report/critical-habitat; Current Range of All Species: https://ecos.fws.gov/ecp/species/2776*     

*Current Listed Species Summary from Environmental Conservation Online System: https://ecos.fws.gov/ecp/report/boxscore*



### Wireframes
![eed7b38198d62beeaa89345db734eaf](https://github.com/user-attachments/assets/7e81147e-10dd-4446-a18c-ab3cb747fd01)











