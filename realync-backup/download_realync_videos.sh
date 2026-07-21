#!/usr/bin/env bash
# Realync backup - Exhibit on Superior (73 videos, ~16.9 GB total)
# Usage: bash download_realync_videos.sh
# Resumable: re-run any time; completed files are skipped, partial ones continue.
mkdir -p realync_backup
cd realync_backup

dl() {
  local n="$1" fn="$2" url="$3" size="$4"
  if [ -f "$fn" ] && [ "$(stat -f%z "$fn" 2>/dev/null || stat -c%s "$fn")" -ge "$size" ]; then
    echo "[$n/73] SKIP (done) $fn"; return 0; fi
  echo "[$n/73] $fn"
  local try=0
  until curl --http1.1 -L -C - --retry 5 --retry-all-errors --speed-time 30 --speed-limit 1000 -o "$fn" "$url"; do
    try=$((try+1)); [ $try -ge 10 ] && { echo "FAILED after 10 attempts: $fn"; return 1; }
    echo "  ...connection dropped, resuming ($try)"; sleep 2
  done
}

FAILS=0
dl 1 "01 - 606 - 2 Bed 1 Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_4849F933-9C9E-46AD-8562-38E17C48DF61/2160_4849F933-9C9E-46AD-8562-38E17C48DF61_2160_mc.mp4" 296119831 || FAILS=$((FAILS+1))
dl 2 "02 - 2006 - 2 Bed 1 bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_8cd2d77a-3590-41ea-aaee-14a6a86d88a7/2160_8cd2d77a-3590-41ea-aaee-14a6a86d88a7_2160_mc.mp4" 134128927 || FAILS=$((FAILS+1))
dl 3 "03 - 2 Bed Plus Den - 2804.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_E419BAAD-C730-4361-A95B-E3A45E50F3F8/2160_E419BAAD-C730-4361-A95B-E3A45E50F3F8_2160_mc.mp4" 365960627 || FAILS=$((FAILS+1))
dl 4 "04 - 207 - 1 Bedroom (North Facing).mp4" "https://cdn.realync.com/transcoded-videos-s/2160_E3C9E5B8-2157-4885-B306-C72F93B44CBD/2160_E3C9E5B8-2157-4885-B306-C72F93B44CBD_2160_mc.mp4" 294007572 || FAILS=$((FAILS+1))
dl 5 "05 - 2702 - Large Convertible.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_D32B0D0A-0317-4E96-9E2C-E96DC9BD1C05/2160_D32B0D0A-0317-4E96-9E2C-E96DC9BD1C05_2160_mc.mp4" 267751490 || FAILS=$((FAILS+1))
dl 6 "06 - 2801 - Corner 2 Bed 2 Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_9CFD9451-3147-45BC-875D-221B3D0ABB1E/2160_9CFD9451-3147-45BC-875D-221B3D0ABB1E_2160_mc.mp4" 412291008 || FAILS=$((FAILS+1))
dl 7 "07 - 2207 - 1 Bedroom.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_8F163E42-140B-4121-9EFA-98076671AF72/2160_8F163E42-140B-4121-9EFA-98076671AF72_2160_mc.mp4" 279592991 || FAILS=$((FAILS+1))
dl 8 "08 - 1709 - Corner 2 Bed 1 Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_246D6528-D82B-4AB7-B399-192D9451C845/2160_246D6528-D82B-4AB7-B399-192D9451C845_2160_mc.mp4" 380907998 || FAILS=$((FAILS+1))
dl 9 "09 - 2302 - Large Convertible.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_3F0C8A15-CE65-4668-AB4E-4753DDF1C151/2160_3F0C8A15-CE65-4668-AB4E-4753DDF1C151_2160_mc.mp4" 273308610 || FAILS=$((FAILS+1))
dl 10 "10 - 2409 - 2 Bed 1 Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_DE42738B-7F66-4F7A-8A04-F1F915C5F635/2160_DE42738B-7F66-4F7A-8A04-F1F915C5F635_2160_mc.mp4" 368799338 || FAILS=$((FAILS+1))
dl 11 "11 - 1907 - 1 Bedroom.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_D8698976-C410-4993-84D0-9E3918454718/2160_D8698976-C410-4993-84D0-9E3918454718_2160_mc.mp4" 273864757 || FAILS=$((FAILS+1))
dl 12 "12 - 2910 - Jr Convertible (ADA).mp4" "https://cdn.realync.com/transcoded-videos-s/2160_58A19D35-FA99-4CB9-B9C5-AE8BAE95CB20/2160_58A19D35-FA99-4CB9-B9C5-AE8BAE95CB20_2160_mc.mp4" 255597554 || FAILS=$((FAILS+1))
dl 13 "13 - 1004 - Corner 2 Bed Plus Den (ADA).mp4" "https://cdn.realync.com/transcoded-videos-s/2160_B7C51494-C2FD-48B6-8DB5-D9246768CA68/2160_B7C51494-C2FD-48B6-8DB5-D9246768CA68_2160_mc.mp4" 470588286 || FAILS=$((FAILS+1))
dl 14 "14 - 2703 - ‘03 Studio.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_4BDA4233-3176-4DE3-B37B-273033352783/2160_4BDA4233-3176-4DE3-B37B-273033352783_2160_mc.mp4" 266465560 || FAILS=$((FAILS+1))
dl 15 "15 - 3201 - Corner 3 Bed 3 Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_C89AE2AD-6BBA-4129-906D-59B18E8F3F80/2160_C89AE2AD-6BBA-4129-906D-59B18E8F3F80_2160_mc.mp4" 555533536 || FAILS=$((FAILS+1))
dl 16 "16 - 3107 - Corner 2 Bed 1 Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_72891D62-D439-44A6-8DD8-CE26A26BABAF/2160_72891D62-D439-44A6-8DD8-CE26A26BABAF_2160_mc.mp4" 408896574 || FAILS=$((FAILS+1))
dl 17 "17 - 3105 - 1 Bedroom.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_E66CAF64-2BF2-494E-B4E9-E667265173D6/2160_E66CAF64-2BF2-494E-B4E9-E667265173D6_2160_mc.mp4" 344066841 || FAILS=$((FAILS+1))
dl 18 "18 - 2301 - 2 Bed 2 Bathroom.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_1B9C254A-59D8-49CA-B7C9-FAEA66249FA3/2160_1B9C254A-59D8-49CA-B7C9-FAEA66249FA3_2160_mc.mp4" 389386456 || FAILS=$((FAILS+1))
dl 19 "19 - 809 - 2 Bed 1 Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_2968B49C-C5D9-40D2-9AA5-4C6F5E36CCF1/2160_2968B49C-C5D9-40D2-9AA5-4C6F5E36CCF1_2160_mc.mp4" 339131883 || FAILS=$((FAILS+1))
dl 20 "20 - 910 - Jr Convertible ‘10.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_ED36A14A-555D-4B32-BBDC-6EE0CD11D0D5/2160_ED36A14A-555D-4B32-BBDC-6EE0CD11D0D5_2160_mc.mp4" 251579755 || FAILS=$((FAILS+1))
dl 21 "21 - 1606 - 2 Bed 1 Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_B3EFDF0C-0351-4B26-AF74-0C5F548896DF/2160_B3EFDF0C-0351-4B26-AF74-0C5F548896DF_2160_mc.mp4" 307227246 || FAILS=$((FAILS+1))
dl 22 "22 - Unit - 0601- Two Bedroom 01A.mp4" "https://cdn.realync.com/transcoded-videos-s/B02AB6A2-268C-4374-B54E-4A651D07199C/MP4WEB.mp4" 52472173 || FAILS=$((FAILS+1))
dl 23 "23 - Unit 1306- 1 Bed + Den.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_870a009d-56f2-4264-9e83-bf7091baf5ed/2160_870a009d-56f2-4264-9e83-bf7091baf5ed_2160_mc.mp4" 393198522 || FAILS=$((FAILS+1))
dl 24 "24 - 3402 - 3 Bed 3 Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_3E25CE89-CB94-4562-A4EA-8E55FDF51332/2160_3E25CE89-CB94-4562-A4EA-8E55FDF51332_2160_mc.mp4" 491531119 || FAILS=$((FAILS+1))
dl 25 "25 - 2308 - 1 Bedroom Walkin-in Closet (ADA).mp4" "https://cdn.realync.com/transcoded-videos-s/2160_3D617C20-26B3-4BD3-9E81-B2A9230D30F8/2160_3D617C20-26B3-4BD3-9E81-B2A9230D30F8_2160_mc.mp4" 286316431 || FAILS=$((FAILS+1))
dl 26 "26 - 2903 - ‘03 Studio.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_2E3C03D2-AB5B-46FF-8CC4-F27E92D6DD26/2160_2E3C03D2-AB5B-46FF-8CC4-F27E92D6DD26_2160_mc.mp4" 276431427 || FAILS=$((FAILS+1))
dl 27 "27 - 3205 - ‘05 1 Bedroom.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_E4776C39-8207-4251-AA9F-710323EE5EC4/2160_E4776C39-8207-4251-AA9F-710323EE5EC4_2160_mc.mp4" 273241481 || FAILS=$((FAILS+1))
dl 28 "28 - 2008 - 1 Bedroom (Walk-in Closet).mp4" "https://cdn.realync.com/transcoded-videos-s/2160_38222547-9204-4A28-92DE-BF5EAC9B4B4E/2160_38222547-9204-4A28-92DE-BF5EAC9B4B4E_2160_mc.mp4" 320204773 || FAILS=$((FAILS+1))
dl 29 "29 - 2002 - Large Convertible.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_F30546DD-3D9B-4BB4-9438-A8809DB0EB30/2160_F30546DD-3D9B-4BB4-9438-A8809DB0EB30_2160_mc.mp4" 288365274 || FAILS=$((FAILS+1))
dl 30 "30 - 1408 - ADA 1 Bedroom (Walk-in Closet).mp4" "https://cdn.realync.com/transcoded-videos-s/2160_80B8DCD6-9901-43B3-BF4D-AE70479EBE87/2160_80B8DCD6-9901-43B3-BF4D-AE70479EBE87_2160_mc.mp4" 297350083 || FAILS=$((FAILS+1))
dl 31 "31 - 1503 - Studio ‘03.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_150A742D-D400-40D4-979C-68191DB5D4A7/2160_150A742D-D400-40D4-979C-68191DB5D4A7_2160_mc.mp4" 309803584 || FAILS=$((FAILS+1))
dl 32 "32 - Large Convertible - 2802.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_04295E4C-085E-4136-8847-F150D7B6F1DA/2160_04295E4C-085E-4136-8847-F150D7B6F1DA_2160_mc.mp4" 237636340 || FAILS=$((FAILS+1))
dl 33 "33 - Studio ‘03 - 2803.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_BDE37B50-FD67-4433-B0EA-E26BD55BA052/2160_BDE37B50-FD67-4433-B0EA-E26BD55BA052_2160_mc.mp4" 254326607 || FAILS=$((FAILS+1))
dl 34 "34 - 2 bed 2 bath - 2501.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_1a81d45d-e34b-483a-9f34-d25ef2ba7f93/2160_1a81d45d-e34b-483a-9f34-d25ef2ba7f93_2160_mc.mp4" 213605621 || FAILS=$((FAILS+1))
dl 35 "35 - Large Convertible - 1502.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_F7011FBB-E77A-4545-8E95-A7C0BDB32E00/2160_F7011FBB-E77A-4545-8E95-A7C0BDB32E00_2160_mc.mp4" 287170219 || FAILS=$((FAILS+1))
dl 36 "36 - 1 Bedroom - Walkin Closet - 3306.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_64A2EDAA-531F-4FBF-8607-1D9F412F33A5/2160_64A2EDAA-531F-4FBF-8607-1D9F412F33A5_2160_mc.mp4" 329918112 || FAILS=$((FAILS+1))
dl 37 "37 - 3 Bed 3 Bath - Unit 3401.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_80CA43AF-510D-48FE-AB9A-1526B47DCE76/2160_80CA43AF-510D-48FE-AB9A-1526B47DCE76_2160_mc.mp4" 502099937 || FAILS=$((FAILS+1))
dl 38 "38 - 2 Bedroom 1 Bath - 1309.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_4E5A6CAB-AEF3-4A05-989D-EE5D71360F09/2160_4E5A6CAB-AEF3-4A05-989D-EE5D71360F09_2160_mc.mp4" 270089352 || FAILS=$((FAILS+1))
dl 39 "39 - 1 Bedroom With Walk-In Closet - 1708.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_B1C3F64A-4B7C-4B8D-89A9-B288CE4B6F08/2160_B1C3F64A-4B7C-4B8D-89A9-B288CE4B6F08_2160_mc.mp4" 234710175 || FAILS=$((FAILS+1))
dl 40 "40 - Jr. Convertible #1110.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_5dce8f46-1b2a-43d3-9f7a-6ab40aa44c22/2160_5dce8f46-1b2a-43d3-9f7a-6ab40aa44c22_2160_mc.mp4" 157128952 || FAILS=$((FAILS+1))
dl 41 "41 - Unit - 3207 - 1 Bed+Den 09A.mp4" "https://cdn.realync.com/transcoded-videos-s/720_b302e0c9-4570-4974-9eae-20ce3fb3388f/720_b302e0c9-4570-4974-9eae-20ce3fb3388f_720_mc.mp4" 31093632 || FAILS=$((FAILS+1))
dl 42 "42 - Unit - 1307 - One Bedroom 07B.mp4" "https://cdn.realync.com/transcoded-videos-s/720_9d2c02c6-1a55-44fb-bef6-ab2eced62195/720_9d2c02c6-1a55-44fb-bef6-ab2eced62195_720_mc.mp4" 25919822 || FAILS=$((FAILS+1))
dl 43 "43 - 2 Bedroom 2 Bathroom 2401.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_1296DA55-119E-4EB0-A0FC-65082BD2F27E/2160_1296DA55-119E-4EB0-A0FC-65082BD2F27E_2160_mc.mp4" 304743275 || FAILS=$((FAILS+1))
dl 44 "44 - Convertible 2402.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_6866CD2A-BEE7-40CC-8E9B-BCD02FF375CB/2160_6866CD2A-BEE7-40CC-8E9B-BCD02FF375CB_2160_mc.mp4" 194861733 || FAILS=$((FAILS+1))
dl 45 "45 - Three Bedroom 3002.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_176BE8A5-9AD5-468C-8BCB-51DCF76B49F4/2160_176BE8A5-9AD5-468C-8BCB-51DCF76B49F4_2160_mc.mp4" 312005098 || FAILS=$((FAILS+1))
dl 46 "46 - Studio 2503.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_7F4497A6-0509-4593-A8D0-1CDC9853F028/2160_7F4497A6-0509-4593-A8D0-1CDC9853F028_2160_mc.mp4" 208957845 || FAILS=$((FAILS+1))
dl 47 "47 - 1 Bedroom 4M02.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_2E3B10E9-20ED-4D48-A917-FCFAFD408D52/2160_2E3B10E9-20ED-4D48-A917-FCFAFD408D52_2160_mc.mp4" 270240280 || FAILS=$((FAILS+1))
dl 48 "48 - 2 Bedroom 2 Bath 301.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_93609194-C62A-4AAC-BFDE-70248D80430D/2160_93609194-C62A-4AAC-BFDE-70248D80430D_2160_mc.mp4" 272361957 || FAILS=$((FAILS+1))
dl 49 "49 - Corner 2 Bedroom 2 Bathroom 2001.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_F5AFBA3A-B22A-4424-99F2-D9F75AAC192A/2160_F5AFBA3A-B22A-4424-99F2-D9F75AAC192A_2160_mc.mp4" 267224734 || FAILS=$((FAILS+1))
dl 50 "50 - Convertible 3303.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_4006639C-D702-42CF-A3B5-4C3F2C652505/2160_4006639C-D702-42CF-A3B5-4C3F2C652505_2160_mc.mp4" 227169053 || FAILS=$((FAILS+1))
dl 51 "51 - 1402 Convertible.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_7160C06A-2FE8-492A-98C4-FD5C4C8CC0C5/2160_7160C06A-2FE8-492A-98C4-FD5C4C8CC0C5_2160_mc.mp4" 260484568 || FAILS=$((FAILS+1))
dl 52 "52 - Studio 1403.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_A638E079-CB27-44F8-9000-D0A5C5E52193/2160_A638E079-CB27-44F8-9000-D0A5C5E52193_2160_mc.mp4" 203634165 || FAILS=$((FAILS+1))
dl 53 "53 - One Bedroom 401.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_0B9E518B-5468-4741-BB76-3645AB1A4446/2160_0B9E518B-5468-4741-BB76-3645AB1A4446_2160_mc.mp4" 188629777 || FAILS=$((FAILS+1))
dl 54 "54 - 3404 - 2Bedroom-1Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_B0AE05A7-E1EA-48BC-9C4B-7E17D7A2BB1F/2160_B0AE05A7-E1EA-48BC-9C4B-7E17D7A2BB1F_2160_mc.mp4" 186720132 || FAILS=$((FAILS+1))
dl 55 "55 - Unit 206 - 1 Bedroom.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_FB111532-5EEB-4CA4-ABEB-2308EF884849/2160_FB111532-5EEB-4CA4-ABEB-2308EF884849_2160_mc.mp4" 274349531 || FAILS=$((FAILS+1))
dl 56 "56 - 1201 - 2Bedroom-2Bath.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_98C331EC-3F9F-4392-ADA0-19341757531B/2160_98C331EC-3F9F-4392-ADA0-19341757531B_2160_mc.mp4" 162055028 || FAILS=$((FAILS+1))
dl 57 "57 - 2102.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_E627EF65-E170-4FEA-9176-BEDE28D7D0F2/2160_E627EF65-E170-4FEA-9176-BEDE28D7D0F2_2160_mc.mp4" 134573765 || FAILS=$((FAILS+1))
dl 58 "58 - Unit #4M03.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_2EDBC672-8D87-4309-82EC-F0E61864C9CB/2160_2EDBC672-8D87-4309-82EC-F0E61864C9CB_2160_mc.mp4" 293359518 || FAILS=$((FAILS+1))
dl 59 "59 - 603.mp4" "https://cdn.realync.com/transcoded-videos-s/2160_08DE3138-E1C2-4C3E-B4B9-E8AEE4ABA71C/2160_08DE3138-E1C2-4C3E-B4B9-E8AEE4ABA71C_2160_mc.mp4" 163575800 || FAILS=$((FAILS+1))
dl 60 "60 - 403.mp4" "https://cdn.realync.com/transcoded-videos-s/1D594AE7-4922-4B42-B597-B8D2A51897BE/MP4WEB.mp4" 32805271 || FAILS=$((FAILS+1))
dl 61 "61 - Unit - 1303 - Studio03.mp4" "https://cdn.realync.com/transcoded-videos-s/B3ECD37F-68E4-4188-8DB8-5B38B4E4B20D/MP4WEB.mp4" 19976444 || FAILS=$((FAILS+1))
dl 62 "62 - Unit - 3101 - Three Bedroom 01.mp4" "https://cdn.realync.com/transcoded-videos-s/8D85A8ED-D653-44CB-90B8-E75D7F8C3BE8/MP4WEB.mp4" 42210225 || FAILS=$((FAILS+1))
dl 63 "63 - Unit - 302 - Studio.mp4" "https://cdn.realync.com/transcoded-videos-s/7836D8BD-ADBA-4F55-82E6-7683F44E97EE/MP4WEB.mp4" 32962253 || FAILS=$((FAILS+1))
dl 64 "64 - Music Room.mp4" "https://cdn.realync.com/transcoded-videos-s/B4B346F8-6B42-4924-99CB-B5C09B9AC5D1/MP4WEB.mp4" 18247864 || FAILS=$((FAILS+1))
dl 65 "65 - Unit - 1204 - Two Bedroom + Den 04.mp4" "https://cdn.realync.com/transcoded-videos-s/18587284-9E08-46EB-A1D1-5C68FD816432/MP4WEB.mp4" 55949721 || FAILS=$((FAILS+1))
dl 66 "66 - Unit - 2405 - JrConv05.mp4" "https://cdn.realync.com/transcoded-videos-s/99A352A2-B693-447D-89F2-DCF1CB03FDDC/MP4WEB.mp4" 33141961 || FAILS=$((FAILS+1))
dl 67 "67 - Unit - 1703 - Studio03.mp4" "https://cdn.realync.com/transcoded-videos-s/5276FB83-6854-4940-AD84-20322502F884/MP4WEB.mp4" 28714844 || FAILS=$((FAILS+1))
dl 68 "68 - Unit - 2103 - Studio03.mp4" "https://cdn.realync.com/transcoded-videos-s/D9213E1D-E916-4036-A04A-82148A0BF79C/MP4WEB.mp4" 24921990 || FAILS=$((FAILS+1))
dl 69 "69 - Unit - 708 - One Bedroom 08A.mp4" "https://cdn.realync.com/transcoded-videos-s/A1010BFE-3229-4E8F-A15C-CB0570BAA53D/MP4WEB.mp4" 21037437 || FAILS=$((FAILS+1))
dl 70 "70 - Jr. Convertible North Facing #2010.mp4" "https://cdn.realync.com/transcoded-videos-s/7FDED002-F821-4C86-AD5F-6BE4CC85953E/MP4WEB.mp4" 30746405 || FAILS=$((FAILS+1))
dl 71 "71 - Unit - 1206 - Two Bedroom.mp4" "https://cdn.realync.com/transcoded-videos-s/DE6CDCE7-41BD-48B6-B1D6-2C3271DCFEB6/MP4WEB.mp4" 45383285 || FAILS=$((FAILS+1))
dl 72 "72 - Unit - 3105 - One Bedroom 05.mp4" "https://cdn.realync.com/transcoded-videos-s/264FA50E-BC31-4C70-886F-1A7126221C2F/MP4WEB.mp4" 46595687 || FAILS=$((FAILS+1))
dl 73 "73 - Jr. Convertible With Balcony With Great Natural Light 2010.mp4" "https://cdn.realync.com/transcoded-videos-s/40F7C56D-8416-48AC-88FF-809B54547E1A/MP4WEB.mp4" 35697163 || FAILS=$((FAILS+1))

echo; echo "Done. Failures: $FAILS (re-run this script to retry/resume any failures)"
