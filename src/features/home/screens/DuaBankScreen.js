import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  BackHandler,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import CalendarModal from '../components/modal/CalendarModal';
import { COMMON_FILTERS } from '../constants/filters';
import { AuthContext } from '../../../context/AuthContext';
import { hapticTap } from '../../../utils/haptics';

const DUAS = [
  // Morning Adhkar
  {
    id: 'morning-protection-from-jinn',
    title: 'Protection from Jinn',
    category: 'Morning',
    arabic:
      'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    translation:
      'Allah! There is no god but He, the Living, the Self-subsisting, Eternal. No slumber can seize Him nor sleep. His are all things in the heavens and on earth. Who is there can intercede in His presence except as He permitteth? He knoweth what (appeareth to His creatures as) before or after or behind them. Nor shall they compass aught of His knowledge except as He willeth. His Throne doth extend over the heavens and the earth, and He feeleth no fatigue in guarding and preserving them for He is the Most High, the Supreme (in glory).',
    reference: '[Quran 2:255]',
  },
  {
    id: 'morning-master-forgiveness',
    title: 'Master Forgiveness',
    category: 'Morning',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    translation:
      'O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil, which I have committed. I acknowledge Your favour upon me and I acknowledge my sins, so forgive me, for verily none can forgive sins except You.',
    reference: '[Bukhari]',
  },
  {
    id: 'morning-contentment',
    title: 'Morning Contentment',
    category: 'Morning',
    arabic:
      'رَضِيتُ بِاللَّهِ رَبَّاً، وَبِالْإِسْلَامِ دِيناً، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيَّاً',
    translation:
      'I am content with Allah as my Lord, with Islam as my religion, and with Muhammad (peace and blessings of Allah be upon him) as my Prophet.',
    reference: '[Abu Dawud]',
  },
  {
    id: 'morning-protection-from-harm',
    title: 'Protection from Harm',
    category: 'Morning',
    arabic:
      'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    translation:
      'In the Name of Allah with Whose Name there is protection against every kind of harm in the earth or in the heaven, and He is the All-Hearing and All-Knowing.',
    reference: '[Tirmidhi]',
  },
  {
    id: 'morning-seeking-guidance',
    title: 'Seeking Guidance',
    category: 'Morning',
    arabic:
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي',
    translation:
      'O Allah, I ask You for forgiveness and well-being in this world and the next. O Allah, I ask You for forgiveness and well-being in my religious and worldly affairs, and my family and my wealth. O Allah, conceal my faults and calm my fears. O Allah, guard me from in front of me and behind me, from my right and from my left, and from above me. I seek refuge in Your greatness from being swallowed up from beneath me.',
    reference: '[Ibn Majah]',
  },
  {
    id: 'morning-plea-for-wellness',
    title: 'Plea for Wellness',
    category: 'Morning',
    arabic:
      'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ',
    translation:
      'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. There is no god but You.',
    reference: '[Abu Dawud]',
  },
  {
    id: 'morning-sovereignty',
    title: 'Morning Sovereignty',
    category: 'Morning',
    arabic:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ، وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    translation:
      'We have reached the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this day and the good of what follows it and I take refuge in You from the evil of this day and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from punishment in the Fire and punishment in the grave.',
    reference: '[Muslim]',
  },
  {
    id: 'morning-beneficial-knowledge',
    title: 'Beneficial Knowledge',
    category: 'Morning',
    arabic:
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
    translation:
      'O Allah, I ask You for knowledge that is of benefit, a good provision, and deeds that will be accepted.',
    reference: '[Ibn Majah]',
  },
  {
    id: 'morning-praising-allah',
    title: 'Praising Allah',
    category: 'Morning',
    arabic:
      'سُبْحَانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ',
    translation:
      'Glory is to Allah and praise is to Him, by the multitude of His creation, by His Pleasure, by the weight of His Throne, and by the extent of His Words.',
    reference: '[Muslim]',
  },
  {
    id: 'morning-refuge-from-shirk',
    title: 'Refuge from Shirk',
    category: 'Morning',
    arabic:
      'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ أَنْ أُشْرِكَ بِكَ وَأَنَا أَعْلَمُ، وَأَسْتَغْفِرُكَ لِمَا لَا أَعْلَمُ',
    translation:
      'O Allah, I seek refuge in You from associating anything with You knowingly, and I seek Your forgiveness for that which I do unknowingly.',
    reference: '[Ahmad]',
  },

  // Evening Adhkar
  {
    id: 'evening-sovereignty',
    title: 'Evening Sovereignty',
    category: 'Evening',
    arabic:
      'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ، وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    translation:
      'We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this night and the good of what follows it and I take refuge in You from the evil of this night and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from punishment in the Fire and punishment in the grave.',
    reference: '[Muslim]',
  },
  {
    id: 'evening-refuge-from-evil',
    title: 'Refuge from Evil',
    category: 'Evening',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    translation:
      'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    reference: '[Muslim]',
  },
  {
    id: 'evening-protection-from-fire',
    title: 'Protection from Fire',
    category: 'Evening',
    arabic: 'اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ',
    translation: 'O Allah, protect me from the Fire.',
    reference: '[Abu Dawud]',
  },
  {
    id: 'evening-master-forgiveness',
    title: 'Master Forgiveness',
    category: 'Evening',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    translation:
      'O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil, which I have committed. I acknowledge Your favour upon me and I acknowledge my sins, so forgive me, for verily none can forgive sins except You.',
    reference: '[Bukhari]',
  },
  {
    id: 'evening-contentment',
    title: 'Evening Contentment',
    category: 'Evening',
    arabic:
      'رَضِيتُ بِاللَّهِ رَبَّاً، وَبِالْإِسْلَامِ دِيناً، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيَّاً',
    translation:
      'I am content with Allah as my Lord, with Islam as my religion, and with Muhammad (peace and blessings of Allah be upon him) as my Prophet.',
    reference: '[Tirmidhi]',
  },
  {
    id: 'evening-wellbeing',
    title: 'Evening Wellbeing',
    category: 'Evening',
    arabic:
      'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ',
    translation:
      'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. There is no god but You.',
    reference: '[Abu Dawud]',
  },
  {
    id: 'evening-seeking-pardon',
    title: 'Seeking Pardon',
    category: 'Evening',
    arabic:
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي',
    translation:
      'O Allah, I ask You for forgiveness and well-being in this world and the next. O Allah, I ask You for forgiveness and well-being in my religious and worldly affairs, and my family and my wealth. O Allah, conceal my faults and calm my fears. O Allah, guard me from in front of me and behind me, from my right and from my left, and from above me. I seek refuge in Your greatness from being swallowed up from beneath me.',
    reference: '[Ibn Majah]',
  },
  {
    id: 'evening-gratitude',
    title: 'Evening Gratitude',
    category: 'Evening',
    arabic:
      'اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ، فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
    translation:
      'O Allah, whatever blessing has reached me or any of Your creatures in the evening is from You alone, You have no partner, so for You is all praise and unto You is all thanks.',
    reference: '[Abu Dawud]',
  },
  {
    id: 'evening-refuge-from-anxiety',
    title: 'Refuge from Anxiety',
    category: 'Evening',
    arabic:
      'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    translation:
      'O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.',
    reference: '[Bukhari]',
  },
  {
    id: 'evening-praising-the-creator',
    title: 'Praising the Creator',
    category: 'Evening',
    arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
    translation: 'Glory be to Allah and all praise is due to Him.',
    reference: '[Muslim]',
  },

  // Sleep Adhkar
  {
    id: 'sleep-protection-from-shaytan',
    title: 'Protection from Shaytan',
    category: 'Sleep',
    arabic:
      'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ...',
    translation: 'Ayat al-Kursi protects the believer until the morning.',
    reference: '[Bukhari]',
  },
  {
    id: 'sleep-sufficient-for-the-night',
    title: 'Sufficient for the Night',
    category: 'Sleep',
    arabic:
      'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ...',
    translation:
      'The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers...',
    reference: '[Quran 2:285-286]',
  },
  {
    id: 'sleep-in-your-name',
    title: 'In Your Name',
    category: 'Sleep',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    translation: 'In Your Name, O Allah, I die and I live.',
    reference: '[Bukhari]',
  },
  {
    id: 'sleep-submission-of-soul',
    title: 'Submission of Soul',
    category: 'Sleep',
    arabic:
      'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ',
    translation:
      'O Allah, I submit my soul to You and I entrust my affair to You and I turn my face to You and I lean my back towards You out of hope and fear of You. There is no refuge and no place of safety from You except with You. I believe in Your Book which You have revealed and in Your Prophet whom You have sent.',
    reference: '[Bukhari]',
  },
  {
    id: 'sleep-forgiveness-before-sleep',
    title: 'Forgiveness before Sleep',
    category: 'Sleep',
    arabic:
      'أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ',
    translation:
      'I seek forgiveness from Allah, there is no deity but He, the Living, the Sustainer, and I repent to Him.',
    reference: '[Tirmidhi]',
  },
  {
    id: 'sleep-tasbih-fatimi',
    title: 'Tasbih Fatimi',
    category: 'Sleep',
    arabic: 'سُبْحَانَ الله (33x) الْحَمْدُ لله (33x) اللهُ أَكْبَر (34x)',
    translation: 'Glory be to Allah, Praise be to Allah, Allah is Greatest.',
    reference: '[Bukhari]',
  },
  {
    id: 'sleep-disavowal-of-shirk',
    title: 'Disavowal of Shirk',
    category: 'Sleep',
    arabic:
      'قُلْ يَا أَيُّهَا الْكَافِرُونَ ۞ لَا أَعْبُدُ مَا تَعْبُدُونَ ۞ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ ۞ وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ ۞ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ ۞ لَكُمْ دِينُكُمْ وَلِيَ دِينِ',
    translation: 'Say, "O disbelievers, I do not worship what you worship..."',
    reference: '[Quran 109]',
  },
  {
    id: 'sleep-protection-from-grave',
    title: 'Protection from Grave',
    category: 'Sleep',
    arabic:
      'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ...',
    translation:
      'Surah Al-Mulk: Recited for protection from the punishment of the grave.',
    reference: '[Tirmidhi]',
  },
  {
    id: 'sleep-lord-of-heavens',
    title: 'Lord of Heavens',
    category: 'Sleep',
    arabic:
      'اللَّهُمَّ رَبَّ السَّمَاوَاتِ السَّبْعِ وَرَبَّ الْعَرْشِ الْعَظِيمِ، رَبَّنَا وَرَبَّ كُلِّ شَيْءٍ، فَالِقَ الْحَبِّ وَالنَّوَى، وَمُنْزِلَ التَّوْرَاةِ وَالْإِنْجِيلِ وَالْفُرْقَانِ، أَعُوذُ بِكَ مِنْ شَرِّ كُلِّ شَيْءٍ أَنْتَ آخِذٌ بِنَاصِيَتِهِ',
    translation:
      'O Allah, Lord of the seven heavens and Lord of the Magnificent Throne, our Lord and the Lord of everything...',
    reference: '[Muslim]',
  },
  {
    id: 'sleep-waking-up-gratitude',
    title: 'Waking Up Gratitude',
    category: 'Sleep',
    arabic:
      'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    translation:
      'Praise is to Allah who gave us life after He had given us death and unto Him is the resurrection.',
    reference: '[Bukhari]',
  },

  // Quranic Duas
  {
    id: 'quranic-success-in-both-worlds',
    title: 'Success in Both Worlds',
    category: 'Quranic',
    arabic:
      'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    translation:
      'Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.',
    reference: '[2:201]',
  },
  {
    id: 'quranic-firmness-in-faith',
    title: 'Firmness in Faith',
    category: 'Quranic',
    arabic:
      'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ',
    translation:
      'Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.',
    reference: '[3:8]',
  },
  {
    id: 'quranic-acceptance-of-deeds',
    title: 'Acceptance of Deeds',
    category: 'Quranic',
    arabic:
      'رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ',
    translation:
      'Our Lord, accept [this] from us. Indeed You are the Hearing, the Knowing.',
    reference: '[2:127]',
  },
  {
    id: 'quranic-patience-and-victory',
    title: 'Patience and Victory',
    category: 'Quranic',
    arabic:
      'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
    translation:
      'Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.',
    reference: '[2:250]',
  },
  {
    id: 'quranic-forgiveness-for-believers',
    title: 'Forgiveness for Believers',
    category: 'Quranic',
    arabic:
      'رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِّلَّذِينَ آمَنُوا رَبَّنَا إِنَّكَ رَءُوفٌ رَّحِيمٌ',
    translation:
      'Our Lord, forgive us and our brothers who preceded us in faith and put not in our hearts [any] resentment toward those who have believed. Our Lord, indeed You are Kind and Merciful.',
    reference: '[59:10]',
  },
  {
    id: 'quranic-coolness-of-eyes',
    title: 'Coolness of Eyes',
    category: 'Quranic',
    arabic:
      'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    translation:
      'Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.',
    reference: '[25:74]',
  },
  {
    id: 'quranic-perfection-of-light',
    title: 'Perfection of Light',
    category: 'Quranic',
    arabic:
      'رَبَّنَا أَتْمِمْ لَنَا نُورَنَا وَاغْفِرْ لَنَا ۖ إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    translation:
      'Our Lord, perfect for us our light and forgive us. Indeed, You are over all things competent.',
    reference: '[66:8]',
  },
  {
    id: 'quranic-refuge-from-hellfire',
    title: 'Refuge from Hellfire',
    category: 'Quranic',
    arabic:
      'رَبَّنَا اصْرِفْ عَنَّا عَذَابَ جَهَنَّمَ ۖ إِنَّ عَذَابَهَا كَانَ غَرَامًا',
    translation:
      'Our Lord, avert from us the punishment of Hell. Indeed, its punishment is ever adhering.',
    reference: '[25:65]',
  },
  {
    id: 'quranic-mercy-for-parents',
    title: 'Mercy for Parents',
    category: 'Quranic',
    arabic:
      'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
    translation:
      'Our Lord, forgive me and my parents and the believers the Day the account is established.',
    reference: '[14:41]',
  },
  {
    id: 'quranic-burden-and-ease',
    title: 'Burden and Ease',
    category: 'Quranic',
    arabic:
      'رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا...',
    translation:
      'Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us...',
    reference: '[2:286]',
  },

  // Sunnah Duas
  {
    id: 'sunnah-leaving-the-house',
    title: 'Leaving the House',
    category: 'Sunnah',
    arabic:
      'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    translation:
      'In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.',
    reference: '[Tirmidhi]',
  },
  {
    id: 'sunnah-after-salah-peace',
    title: 'After Salah Peace',
    category: 'Sunnah',
    arabic:
      'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    translation:
      'O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of Majesty and Honour.',
    reference: '[Muslim]',
  },
  {
    id: 'sunnah-entering-the-house',
    title: 'Entering the House',
    category: 'Sunnah',
    arabic:
      'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
    translation:
      'In the Name of Allah we enter, and in the Name of Allah we leave, and upon our Lord we place our trust.',
    reference: '[Abu Dawud]',
  },
  {
    id: 'sunnah-relief-from-distress',
    title: 'Relief from Distress',
    category: 'Sunnah',
    arabic: 'اللَّهُ اللَّهُ رَبِّي لَا أُشْرِكُ بِهِ شَيْئًا',
    translation: 'Allah, Allah is my Lord; I do not associate anything with Him.',
    reference: '[Abu Dawud]',
  },
  {
    id: 'sunnah-breaking-the-fast',
    title: 'Breaking the Fast',
    category: 'Sunnah',
    arabic:
      'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ',
    translation:
      'The thirst has gone, the veins are moistened, and the reward is certain, if Allah wills.',
    reference: '[Abu Dawud]',
  },
  {
    id: 'sunnah-entering-mosque',
    title: 'Entering Mosque',
    category: 'Sunnah',
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    translation: 'O Allah, open the gates of Your mercy for me.',
    reference: '[Muslim]',
  },
  {
    id: 'sunnah-leaving-mosque',
    title: 'Leaving Mosque',
    category: 'Sunnah',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    translation: 'O Allah, I ask You from Your bounty.',
    reference: '[Muslim]',
  },
  {
    id: 'sunnah-after-wudu',
    title: 'After Wudu',
    category: 'Sunnah',
    arabic:
      'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    translation:
      'I bear witness that there is no god but Allah alone without partner, and I bear witness that Muhammad is His servant and Messenger.',
    reference: '[Muslim]',
  },
  {
    id: 'sunnah-before-eating',
    title: 'Before Eating',
    category: 'Sunnah',
    arabic: 'بِسْمِ اللَّهِ',
    translation: 'In the Name of Allah.',
    reference: '[Bukhari]',
  },
  {
    id: 'sunnah-seeking-forgiveness',
    title: 'Seeking Forgiveness',
    category: 'Sunnah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    translation: "I seek Allah's forgiveness and I repent to Him.",
    reference: '[Bukhari]',
  },
];

function getMonthDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d += 1) {
    days.push(new Date(year, month, d));
  }
  return { firstWeekday: (first.getDay() + 6) % 7, days };
}

export default function DuaBankScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All Duas');
  const [filterOpen, setFilterOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [favoriteIds, setFavoriteIds] = useState([]);

  // Load favorites from AsyncStorage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem('favoriteDuas');
        if (stored) {
          setFavoriteIds(JSON.parse(stored));
        }
      } catch (error) {
        console.log('Error loading favorites:', error);
      }
    };
    loadFavorites();
  }, []);

  // Save favorites to AsyncStorage whenever they change
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem('favoriteDuas', JSON.stringify(favoriteIds));
      } catch (error) {
        console.log('Error saving favorites:', error);
      }
    };
    if (favoriteIds.length > 0 || favoriteIds.length === 0) {
      saveFavorites();
    }
  }, [favoriteIds]);

  const monthData = getMonthDays(selectedDate);
  const monthLabel = selectedDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const isFavorite = duaId => favoriteIds.includes(duaId);

  const toggleFavorite = duaId => {
    hapticTap();
    setFavoriteIds(prev =>
      prev.includes(duaId) ? prev.filter(id => id !== duaId) : [...prev, duaId],
    );
  };

  const visibleDuas =
    segmentFilter === 'My Favourite Duas'
      ? DUAS.filter(dua => favoriteIds.includes(dua.id))
      : DUAS;

  if (selected) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: '#EAF6FF' }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.detailContainer}>
          <Modal visible={filterOpen} transparent animationType="fade">
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setFilterOpen(false)}
            >
              <Pressable style={styles.dropdownCard} onPress={() => {}}>
                {COMMON_FILTERS.map(item => {
                  const active = item === filter;
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.85}
                      style={[
                        styles.dropdownItem,
                        active && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        if (item === 'Custom') {
                          setFilterOpen(false);
                          setTimeout(() => setCalendarOpen(true), 120);
                          return;
                        }
                        setFilter(item);
                        setFilterOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          active && styles.dropdownTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </Pressable>
            </Pressable>
          </Modal>
          <CalendarModal
            visible={calendarOpen}
            monthLabel={monthLabel}
            monthData={monthData}
            selectedDate={selectedDate}
            onSelectDate={date => {
              const next = new Date(date);
              next.setHours(0, 0, 0, 0);
              setSelectedDate(next);
              setFilter('Custom');
            }}
            onClose={() => setCalendarOpen(false)}
          />
          <TouchableOpacity
            onPress={() => setSelected(null)}
            style={styles.backBtnRow}
          >
            <Feather name="arrow-left" size={18} color={colors.textPrimary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>The Dua Bank</Text>
          <Text style={styles.detailSubtitle}>{selected.category}</Text>
          <View style={styles.duaCard}>
            <View style={styles.duaCardRow}>
              <Text style={styles.duaTitle}>{selected.title}</Text>
              <TouchableOpacity
                onPress={() => toggleFavorite(selected.id)}
                activeOpacity={0.85}
                style={styles.heartBtnDetail}
              >
                <MaterialCommunityIcons
                  name={isFavorite(selected.id) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite(selected.id) ? '#E03131' : '#111111'}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.textCard}>
            <Text style={styles.arabic}>{selected.arabic}</Text>
            <Text style={styles.translationTitle}>Translation</Text>
            <Text style={styles.translation}>{selected.translation}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Modal visible={filterOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterOpen(false)}
        >
          <Pressable style={styles.dropdownCard} onPress={() => {}}>
            {COMMON_FILTERS.map(item => {
              const active = item === filter;
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.85}
                  style={[
                    styles.dropdownItem,
                    active && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    if (item === 'Custom') {
                      setFilterOpen(false);
                      setTimeout(() => setCalendarOpen(true), 120);
                      return;
                    }
                    setFilter(item);
                    setFilterOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      active && styles.dropdownTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
      <CalendarModal
        visible={calendarOpen}
        monthLabel={monthLabel}
        monthData={monthData}
        selectedDate={selectedDate}
        onSelectDate={date => {
          const next = new Date(date);
          next.setHours(0, 0, 0, 0);
          setSelectedDate(next);
          setFilter('Custom');
        }}
        onClose={() => setCalendarOpen(false)}
      />

      <View style={styles.container}>
        <Text style={styles.title}>The Dua Bank</Text>

        <View style={styles.segmentRow}>
          {['All Duas', 'My Favourite Duas'].map(item => (
            <TouchableOpacity
              key={item}
              style={[
                styles.segment,
                segmentFilter === item && styles.segmentActive,
              ]}
              onPress={() => {
                hapticTap();
                setSegmentFilter(item);
              }}
            >
              <Text
                style={[
                  styles.segmentText,
                  segmentFilter === item && styles.segmentTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        >
          {visibleDuas.length === 0 && segmentFilter === 'My Favourite Duas' ? (
            <View style={styles.emptyFavCard}>
              <Text style={styles.emptyFavTitle}>No favourite duas yet</Text>
              <Text style={styles.emptyFavSub}>
                Tap the heart icon to save a dua here.
              </Text>
            </View>
          ) : null}

          {visibleDuas.map((dua, i) => (
            <TouchableOpacity
              key={dua.id}
              style={[
                styles.listCard,
                styles.listCardColors[i % styles.listCardColors.length],
              ]}
              onPress={() => {
                hapticTap();
                setSelected(dua);
              }}
            >
              <Text style={styles.listText}>{dua.title}</Text>
              <View style={styles.listRightActions}>
                <TouchableOpacity
                  onPress={e => {
                    e?.stopPropagation?.();
                    toggleFavorite(dua.id);
                  }}
                  activeOpacity={0.85}
                  style={styles.heartBtn}
                >
                  <MaterialCommunityIcons
                    name={isFavorite(dua.id) ? 'heart' : 'heart-outline'}
                    size={18}
                    color={isFavorite(dua.id) ? '#E03131' : '#111111'}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 16,
  },
  segmentRow: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 20 },
  segment: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4E4',
  },
  segmentActive: { backgroundColor: '#F4C9E4' },
  segmentText: { fontSize: 12, color: colors.textPrimary },
  segmentTextActive: { fontWeight: '700' },
  listCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  listRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heartBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  listCardColors: [
    { backgroundColor: '#E0D0F2' },
    { backgroundColor: '#E2D7F5' },
    { backgroundColor: '#F4C9E4' },
    { backgroundColor: '#F7D7B8' },
    { backgroundColor: '#F7EBCB' },
    { backgroundColor: '#D9F0E9' },
    { backgroundColor: '#CFE4F5' },
  ],

  detailContainer: {
    flex: 1,
    backgroundColor: '#EAF6FF',
    paddingHorizontal: 16,
    // paddingTop: 12,
    paddingTop: 16,
  },
  backBtnRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  backText: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 16,
  },
  detailSubtitle: { fontSize: 14, color: colors.textPrimary, marginTop: 6 },
  duaCard: {
    marginTop: 12,
    backgroundColor: '#D8ECFA',
    borderRadius: 12,
    padding: 12,
  },
  duaCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  duaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  heartBtnDetail: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7E0F3',
  },
  textCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  arabic: { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
  translationTitle: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  translation: { marginTop: 6, fontSize: 12, color: '#5C5C5C', lineHeight: 18 },
  emptyFavCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  emptyFavTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  emptyFavSub: { marginTop: 6, fontSize: 12, color: '#6B6B6B' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.10)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: 18,
  },
  dropdownCard: {
    width: 150,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2B7D9',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  dropdownItemActive: {
    backgroundColor: '#F4C9E4',
  },
  dropdownText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dropdownTextActive: {
    fontWeight: '800',
  },
});
